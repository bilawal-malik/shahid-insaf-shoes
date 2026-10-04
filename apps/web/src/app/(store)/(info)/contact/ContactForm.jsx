'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const PK_PHONE = /^(?:\+92|0)?3\d{9}$/;

export default function ContactForm() {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values = {
      name: String(form.get('name') || '').trim(),
      email: String(form.get('email') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      message: String(form.get('message') || '').trim(),
    };

    const errs = {};
    if (values.name.length < 2) errs.name = 'Please enter your name';
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      errs.email = 'Enter a valid email';
    if (values.phone && !PK_PHONE.test(values.phone))
      errs.phone = 'Enter a valid mobile number (03XXXXXXXXX)';
    if (values.message.length < 5) errs.message = 'Message must be at least 5 characters';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await apiClient('/contact', { method: 'POST', body: JSON.stringify(values) });
      toast('Message sent — we will get back to you soon');
      e.target.reset();
      setErrors({});
    } catch (err) {
      toast(err.message || 'Could not send message. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={errors.name}>
          <input name="name" className="input" placeholder="Your name" autoComplete="name" />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input
            name="phone"
            className="input"
            placeholder="03XXXXXXXXX"
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>
      </div>

      <Field label="Email (optional)" error={errors.email}>
        <input
          name="email"
          type="email"
          className="input"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </Field>

      <Field label="Message" required error={errors.message}>
        <textarea
          name="message"
          rows={5}
          className="input resize-y"
          placeholder="How can we help?"
        />
      </Field>

      <button type="submit" disabled={submitting} className="btn-primary !px-8">
        {submitting ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}

function Field({ label, required, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
