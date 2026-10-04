import nodemailer from 'nodemailer';
import env from '../config/env.js';

/**
 * Transactional mail with two transports, tried in order:
 *   1. SMTP (SMTP_HOST + nodemailer) — any provider, needs SMTP credentials
 *   2. Brevo REST API (BREVO_API_KEY) — no SMTP key needed; sender must be a
 *      verified Brevo sender (the account email is verified automatically)
 * If neither is configured the mail is "skipped" and recorded in a
 * non-production dev outbox, readable at GET /admin/mail/outbox (admin only,
 * non-prod). Contract: sendMail NEVER throws and never blocks the request —
 * callers use it fire-and-forget.
 *
 * In production nothing is retained in memory (privacy); delivery is only
 * observable via the provider's own logs.
 */

const OUTBOX_MAX = 50;
const outbox = [];

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: env.mail.user ? { user: env.mail.user, pass: env.mail.pass } : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
    });
  }
  return transporter;
}

function parseFrom() {
  const match = /^(.*)<([^>]+)>\s*$/.exec(env.mail.from);
  return match
    ? { name: match[1].trim().replace(/^"|"$/g, '') || 'SIS Shoes', email: match[2].trim() }
    : { name: 'SIS Shoes', email: env.mail.from.trim() };
}

async function sendViaBrevo({ to, subject, text, html }) {
  const sender = parseFrom();
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.mail.brevoKey, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json().catch(() => ({}));
}

export function isMailConfigured() {
  return Boolean(env.mail.host || env.mail.brevoKey);
}

function record(entry) {
  if (env.isProd) return;
  outbox.unshift({ at: new Date().toISOString(), ...entry });
  if (outbox.length > OUTBOX_MAX) outbox.length = OUTBOX_MAX;
}

export function getOutbox(limit = OUTBOX_MAX) {
  return outbox.slice(0, Math.max(1, Math.min(Number(limit) || OUTBOX_MAX, OUTBOX_MAX)));
}

export async function sendMail({ to, subject, text, html, meta = {} }) {
  if (!to) {
    record({ to: null, subject, skipped: true, reason: 'no recipient', ...meta });
    return { ok: false, skipped: true };
  }
  if (!isMailConfigured()) {
    record({ to, subject, text, skipped: true, reason: 'SMTP not configured', ...meta });
    console.info(`[mail] skipped (SMTP not configured) to=${to} subject="${subject}"`);
    return { ok: false, skipped: true };
  }
  try {
    if (env.mail.host) {
      await getTransporter().sendMail({ from: env.mail.from, to, subject, text, html });
    } else {
      await sendViaBrevo({ to, subject, text, html });
    }
    record({ to, subject, text, sent: true, ...meta });
    console.info(`[mail] sent to=${to} subject="${subject}"`);
    return { ok: true };
  } catch (err) {
    record({ to, subject, text, error: err.message, ...meta });
    console.error(`[mail] failed to=${to} subject="${subject}": ${err.message}`);
    return { ok: false, error: err.message };
  }
}
