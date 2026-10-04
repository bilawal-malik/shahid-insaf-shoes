'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailPrefill = searchParams.get('email') || '';
  const [form, setForm] = useState({
    email: emailPrefill,
    otp: '',
    newPassword: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (form.newPassword !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const body = token
        ? { token, newPassword: form.newPassword }
        : { email: form.email, otp: form.otp, newPassword: form.newPassword };
      await apiClient('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) });
      setDone(true);
    } catch (err) {
      const fields = err.body?.error?.fields;
      setError(
        fields ? Object.values(fields).join(' · ') : err.message || 'Could not reset password'
      );
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Password updated. You can sign in now.
        </div>
        <Link href="/login" className="btn-primary block w-full text-center">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {token ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-3 text-xs text-ink-soft">
          Resetting via secure link — set a new password below.
        </div>
      ) : (
        <>
          <label className="block">
            <span className="label">Email</span>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </label>
          <label className="block">
            <span className="label">6-digit code</span>
            <input
              className="input text-center font-mono text-lg tracking-[0.3em]"
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              required
              value={form.otp}
              onChange={(e) => set('otp', e.target.value.replace(/\D/g, ''))}
            />
          </label>
        </>
      )}

      <label className="block">
        <span className="label">New password</span>
        <input
          type="password"
          className="input"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
          value={form.newPassword}
          onChange={(e) => set('newPassword', e.target.value)}
        />
      </label>

      <label className="block">
        <span className="label">Confirm new password</span>
        <input
          type="password"
          className="input"
          placeholder="Repeat password"
          autoComplete="new-password"
          required
          value={form.confirm}
          onChange={(e) => set('confirm', e.target.value)}
        />
      </label>

      <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
        {submitting ? 'Updating…' : 'Reset password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container-app flex justify-center py-12 lg:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-800 text-base font-black text-white">
            SIS
          </span>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">Set a new password</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Choose a strong password you haven&apos;t used here before
          </p>
        </div>

        <div className="card p-6 sm:p-7">
          <Suspense fallback={<div className="h-64" />}>
            <ResetForm />
          </Suspense>
        </div>

        <p className="mt-5 text-center text-sm text-ink-soft">
          <Link href="/forgot-password" className="hover:text-ink">
            ← Back to code request
          </Link>
        </p>
      </div>
    </div>
  );
}
