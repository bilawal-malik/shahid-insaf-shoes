'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { mergeGuestCart } from '@/lib/cart-sync';
import { safeNext } from '@/lib/checkout';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      await mergeGuestCart();
      const next = searchParams.get('next');
      const dest = res.user?.role === 'admin' && !next ? '/admin' : safeNext(next);
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Could not sign in. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <label className="block">
        <span className="label">Email</span>
        <input name="email" type="email" className="input" placeholder="you@example.com" autoComplete="email" required />
      </label>

      <label className="block">
        <span className="label">Password</span>
        <input
          name="password"
          type="password"
          className="input"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </label>

      <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="container-app flex justify-center py-12 lg:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-800 text-base font-black text-white">
            SIS
          </span>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-soft">Sign in to view your orders and addresses</p>
        </div>

        <div className="card p-6 sm:p-7">
          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-5 text-center text-sm text-ink-soft">
          New here?{' '}
          <Link href="/register" className="font-semibold text-brand-700 hover:text-brand-800">
            Create an account
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-ink-soft">
          <Link href="/products" className="hover:text-brand-700">
            Continue as guest →
          </Link>
        </p>
      </div>
    </div>
  );
}
