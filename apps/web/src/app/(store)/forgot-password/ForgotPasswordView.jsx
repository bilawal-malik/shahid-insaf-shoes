'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setResult(res);
    } catch (err) {
      const fields = err.body?.error?.fields;
      setError(fields ? Object.values(fields).join(' · ') : err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(result.dev.resetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="container-app flex justify-center py-12 lg:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-800 text-base font-black text-white">
            SIS
          </span>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">Forgot password?</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Enter your email and we&apos;ll send you a reset code
          </p>
        </div>

        <div className="card p-6 sm:p-7">
          {!result && (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <label className="block">
                <span className="label">Email</span>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
                {submitting ? 'Sending…' : 'Send reset code'}
              </button>
            </form>
          )}

          {result && !result.dev && (
            <div className="space-y-4 text-center">
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {result.message}
              </div>
              <Link href="/login" className="btn-outline block w-full text-center">
                Back to sign in
              </Link>
            </div>
          )}

          {result?.dev && (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                Development mode — in production this code is emailed to you.
              </div>

              <div className="rounded-xl border border-line bg-surface p-4 text-center">
                <div className="kicker">Reset code</div>
                <div className="mt-1 font-mono text-3xl font-bold tracking-[0.3em] text-ink">
                  {result.dev.otp}
                </div>
                <div className="mt-1 text-xs text-ink-soft">Expires in 30 minutes</div>
              </div>

              <a href={result.dev.resetUrl} className="btn-primary block w-full text-center">
                Open reset link →
              </a>

              <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2">
                <span className="truncate font-mono text-[11px] text-ink-soft">
                  {result.dev.resetUrl}
                </span>
                <button
                  type="button"
                  onClick={copyLink}
                  className="shrink-0 text-xs font-semibold text-brand-700 hover:text-brand-800"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <Link
                href={`/reset-password?email=${encodeURIComponent(email)}`}
                className="block text-center text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Enter code instead →
              </Link>

              <button
                type="button"
                onClick={() => setResult(null)}
                className="block w-full text-center text-sm text-ink-soft hover:text-ink"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-ink-soft">
          Remembered it?{' '}
          <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
