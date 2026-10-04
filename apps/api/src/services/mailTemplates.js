/**
 * Plain-HTML + text transactional templates. Deliberately dependency-free:
 * inline styles, system fonts, works in Gmail/Outlook/Yahoo clients.
 * Every template returns { subject, text, html } for mailService.sendMail.
 */

const BRAND = 'SIS — Shahid Insaf Shoes';

const STATUS_LABELS = {
  placed: 'Order received',
  confirmed: 'Order confirmed',
  shipped: 'Order shipped',
  delivered: 'Order delivered',
  cancelled: 'Order cancelled',
  returned: 'Order returned',
};

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const rs = (n) => `Rs ${Number(n || 0).toLocaleString('en-PK')}`;

function shell(title, preheader, bodyHtml) {
  return `<!doctype html>
<html lang="en">
<body style="margin:0;background:#f4f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f4;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:#14532d;padding:18px 24px;">
          <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:0.5px;">SIS</span>
          <span style="color:#bbf7d0;font-size:12px;margin-left:8px;">Shahid Insaf Shoes</span>
        </td></tr>
        <tr><td style="padding:24px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${esc(title)}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="background:#f9fafb;padding:16px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
          ${BRAND} · This is a transactional message about your account or order.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const paragraph = (html) =>
  `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#374151;">${html}</p>`;

const codeBox = (code) =>
  `<p style="margin:0 0 14px;"><span style="display:inline-block;background:#f3f4f6;border:1px dashed #9ca3af;border-radius:8px;padding:12px 24px;font-family:monospace;font-size:28px;letter-spacing:8px;font-weight:bold;color:#111827;">${esc(code)}</span></p>`;

const button = (href, label) =>
  `<p style="margin:20px 0;"><a href="${esc(href)}" style="background:#14532d;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block;">${esc(label)}</a></p>`;

const keyRows = (rows) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 16px;border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:9px 14px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${esc(k)}</td><td align="right" style="padding:9px 14px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;font-weight:bold;">${esc(v)}</td></tr>`
    )
    .join('')}</table>`;

export function verifyEmailTemplate({ name, otp }) {
  const subject = `Your ${BRAND.split(' — ')[0]} email verification code`;
  const text = [
    `Hi ${name || 'there'},`,
    '',
    `Your email verification code is: ${otp}`,
    'It expires in 15 minutes. Enter it on the SIS website to activate your account.',
    '',
    'If you did not create an account, you can ignore this email.',
  ].join('\n');
  const html = shell(
    'Verify your email',
    `Your verification code is ${otp}`,
    paragraph(`Hi ${esc(name) || 'there'},`) +
      paragraph(
        'Use the code below to verify your email address and activate your account. It expires in <strong>15 minutes</strong>.'
      ) +
      codeBox(otp) +
      paragraph('If you did not create an account, you can safely ignore this email.')
  );
  return { subject, text, html };
}

export function passwordResetTemplate({ name, otp, resetUrl }) {
  const subject = `Your ${BRAND.split(' — ')[0]} password reset code`;
  const text = [
    `Hi ${name || 'there'},`,
    '',
    `Your password reset code is: ${otp}`,
    'It expires in 30 minutes. If you did not request this, you can ignore this email.',
    '',
    'Or open this link to reset directly:',
    resetUrl,
  ].join('\n');
  const html = shell(
    'Reset your password',
    `Your reset code is ${otp}`,
    paragraph(`Hi ${esc(name) || 'there'},`) +
      paragraph(
        'Use the code below to reset your password. It expires in <strong>30 minutes</strong>.'
      ) +
      codeBox(otp) +
      button(resetUrl, 'Open reset link') +
      paragraph('Did not request this? You can safely ignore this email.')
  );
  return { subject, text, html };
}

export function orderPlacedTemplate({ name, orderNumber, total, itemsCount, estimated, trackUrl }) {
  const subject = `Order #${orderNumber} received`;
  const text = [
    `Hi ${name || 'there'},`,
    '',
    `We received your order #${orderNumber} (${itemsCount} item${itemsCount === 1 ? '' : 's'}, ${rs(total)}), Cash on Delivery.`,
    `Estimated delivery: ${estimated}`,
    '',
    'Track it anytime:',
    trackUrl,
  ].join('\n');
  const html = shell(
    `Order #${esc(orderNumber)} received`,
    `Order ${orderNumber} received — ${rs(total)}`,
    paragraph(`Hi ${esc(name) || 'there'},`) +
      paragraph(
        `Thanks for your order! Payment is <strong>Cash on Delivery</strong> — pay when it arrives.`
      ) +
      keyRows([
        ['Order', `#${orderNumber}`],
        ['Items', String(itemsCount)],
        ['Total', rs(total)],
        ['Estimated delivery', estimated],
      ]) +
      button(trackUrl, 'Track order') +
      paragraph('We will email you whenever the status changes.')
  );
  return { subject, text, html };
}

export function orderStatusTemplate({ name, orderNumber, status, note, trackUrl }) {
  const label = STATUS_LABELS[status] || status;
  const subject = `Order #${orderNumber}: ${label}`;
  const text = [
    `Hi ${name || 'there'},`,
    '',
    `Order #${orderNumber} — ${label}.`,
    note ? `Note: ${note}` : '',
    '',
    'Track it anytime:',
    trackUrl,
  ]
    .filter(Boolean)
    .join('\n');
  const html = shell(
    label,
    `Order ${orderNumber} — ${label}`,
    paragraph(`Hi ${esc(name) || 'there'},`) +
      paragraph(`<strong>${esc(label)}</strong> for order <strong>#${esc(orderNumber)}</strong>.`) +
      (note ? paragraph(`Note: ${esc(note)}`) : '') +
      button(trackUrl, 'Track order')
  );
  return { subject, text, html };
}

export function contactTemplate({ name, email, phone, message }) {
  const subject = `New contact message from ${name}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email || '—'}`,
    `Phone: ${phone || '—'}`,
    '',
    message,
  ].join('\n');
  const html = shell(
    'New contact message',
    `Contact message from ${name}`,
    paragraph('A customer just wrote via the contact form:') +
      keyRows([
        ['Name', name],
        ['Email', email || '—'],
        ['Phone', phone || '—'],
      ]) +
      `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap;">${esc(message)}</p>` +
      (email
        ? `<p style="margin:0;font-size:13px;"><a href="mailto:${esc(email)}" style="color:#14532d;">Reply to ${esc(email)}</a></p>`
        : '')
  );
  return { subject, text, html };
}

export function adminOrderTemplate({ orderNumber, total, itemsCount, customer, city, phone }) {
  const subject = `New order #${orderNumber} — ${rs(total)}`;
  const text = [
    'A new COD order was placed:',
    `Order: #${orderNumber}`,
    `Customer: ${customer}${phone ? ` · ${phone}` : ''}`,
    `City: ${city || '—'}`,
    `Items: ${itemsCount}`,
    `Total: ${rs(total)}`,
    '',
    'Open the admin dashboard to process it.',
  ].join('\n');
  const html = shell(
    `New order #${esc(orderNumber)}`,
    `New order ${orderNumber}`,
    paragraph('A new <strong>Cash on Delivery</strong> order is waiting for you:') +
      keyRows([
        ['Order', `#${orderNumber}`],
        ['Customer', customer],
        ['Phone', phone || '—'],
        ['City', city || '—'],
        ['Items', String(itemsCount)],
        ['Total', rs(total)],
      ]) +
      paragraph('Open the admin dashboard to confirm and prepare it for dispatch.')
  );
  return { subject, text, html };
}
