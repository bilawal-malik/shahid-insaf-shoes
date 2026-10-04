'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { PK_PHONE } from '@/lib/checkout';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    const form = new FormData(e.currentTarget);
    const values = {
      name: String(form.get('name') || '').trim(),
      email: String(form.get('email') || '')
        .trim()
        .toLowerCase(),
      phone: String(form.get('phone') || '').trim(),
      password: String(form.get('password') || ''),
      confirm: String(form.get('confirm') || ''),
    };

    const errs = {};
    if (values.name.length < 2) errs.name = 'Please enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errs.email = 'Enter a valid email';
    if (!PK_PHONE.test(values.phone)) errs.phone = 'Enter a valid mobile number (03XXXXXXXXX)';
    if (values.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (values.confirm !== values.password) errs.confirm = 'Passwords do not match';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          password: values.password,
        }),
      });
      const params = new URLSearchParams({ email: values.email });
      router.push(`/verify-email?${params.toString()}`);
    } catch (err) {
      if (err.body?.error?.fields) setFieldErrors(err.body.error.fields);
      setError(err.message || 'Could not create your account.');
      setSubmitting(false);
    }
  }

  return (
    <div className="container-app flex justify-center py-12 lg:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-800 text-base font-black text-white">
            SIS
          </span>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Track orders, save addresses, faster checkout
          </p>
        </div>

        <div className="card p-6 sm:p-7">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <label className="block">
              <span className="label">Full name</span>
              <input name="name" className="input" placeholder="Ali Khan" autoComplete="name" />
              {fieldErrors.name && <FieldError>{fieldErrors.name}</FieldError>}
            </label>

            <label className="block">
              <span className="label">Email</span>
              <input
                name="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
              />
              {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
            </label>

            <label className="block">
              <span className="label">Mobile number</span>
              <input
                name="phone"
                className="input"
                placeholder="03XXXXXXXXX"
                inputMode="tel"
                autoComplete="tel"
              />
              {fieldErrors.phone && <FieldError>{fieldErrors.phone}</FieldError>}
            </label>

            <label className="block">
              <span className="label">Password</span>
              <input
                name="password"
                type="password"
                className="input"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              {fieldErrors.password && <FieldError>{fieldErrors.password}</FieldError>}
            </label>

            <label className="block">
              <span className="label">Confirm password</span>
              <input
                name="confirm"
                type="password"
                className="input"
                placeholder="Repeat password"
                autoComplete="new-password"
              />
              {fieldErrors.confirm && <FieldError>{fieldErrors.confirm}</FieldError>}
            </label>

            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-ink-soft">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
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

function FieldError({ children }) {
  return <span className="mt-1 block text-xs text-red-600">{children}</span>;
}
