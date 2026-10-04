'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailPrefill = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailPrefill);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiClient('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      router.push('/');
      router.refresh();
    } catch (err) {
      const fields = err.body?.error?.fields;
      setError(
        fields ? Object.values(fields).join(' · ') : err.message || 'Could not verify your email'
      );
      setSubmitting(false);
    }
  }

  async function onResend() {
    setError('');
    setInfo('');
    setResending(true);
    try {
      const res = await apiClient('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setInfo(res.message);
    } catch (err) {
      setError(err.message || 'Could not resend the code');
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {info}
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

      <label className="block">
        <span className="label">Verification code</span>
        <input
          className="input text-center font-mono text-xl tracking-[0.4em]"
          placeholder="123456"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />
      </label>

      <button
        type="submit"
        disabled={submitting || otp.length !== 6}
        className="btn-primary w-full !py-3"
      >
        {submitting ? 'Verifying…' : 'Verify Email'}
      </button>

      <button
        type="button"
        onClick={onResend}
        disabled={resending}
        className="block w-full text-center text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        {resending ? 'Sending…' : 'Resend code'}
      </button>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="container-app flex justify-center py-12 lg:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-800 text-base font-black text-white">
            SIS
          </span>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">Verify your email</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Enter the 6-digit code we sent to your inbox to activate your account
          </p>
        </div>

        <div className="card p-6 sm:p-7">
          <Suspense fallback={<div className="h-48" />}>
            <VerifyForm />
          </Suspense>
        </div>

        <p className="mt-5 text-center text-sm text-ink-soft">
          Wrong email?{' '}
          <Link href="/register" className="font-semibold text-brand-700 hover:text-brand-800">
            Start over
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-ink-soft">
          <Link href="/login" className="hover:text-brand-700">
            Back to sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
