'use client';

import { useEffect, useState } from 'react';
import { KeyRound, UserCog } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { PK_PHONE } from '@/lib/checkout';
import { useToast } from '@/components/ui/Toast';
import SettingsTabs from '@/components/admin/SettingsTabs';

export default function ProfileSettings() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', phone: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    let alive = true;
    apiClient('/auth/me')
      .then((r) => {
        if (!alive) return;
        setUser(r.user);
        setProfile({ name: r.user.name, phone: r.user.phone, email: r.user.email });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    if (!PK_PHONE.test(profile.phone.trim())) {
      toast('Enter a valid mobile number (03XXXXXXXXX)', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      const r = await apiClient('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(profile),
      });
      setUser(r.user);
      toast('Profile updated', 'success');
    } catch (err) {
      const fields = err.body?.error?.fields;
      toast(fields ? Object.values(fields).join(' · ') : err.message || 'Update failed', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (pw.newPassword.length < 8) {
      toast('New password must be at least 8 characters', 'error');
      return;
    }
    if (pw.newPassword !== pw.confirm) {
      toast('Passwords do not match', 'error');
      return;
    }
    setSavingPw(true);
    try {
      await apiClient('/auth/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }),
      });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast('Password changed', 'success');
    } catch (err) {
      toast(err.message || 'Could not change password', 'error');
    } finally {
      setSavingPw(false);
    }
  }

  if (!user) return <div className="h-80 max-w-2xl rounded-2xl bg-white/70" />;

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsTabs />
      <form onSubmit={saveProfile} className="card space-y-4 p-5" noValidate>
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          <UserCog className="h-4 w-4 text-brand-600" /> Profile details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Full name</span>
            <input
              className="input"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="label">Mobile number</span>
            <input
              className="input"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              inputMode="tel"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            />
          </label>
        </div>
        <button type="submit" disabled={savingProfile} className="btn-primary">
          {savingProfile ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <form onSubmit={savePassword} className="card space-y-4 p-5" noValidate>
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          <KeyRound className="h-4 w-4 text-brand-600" /> Change password
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="label">Current</span>
            <input
              className="input"
              type="password"
              value={pw.currentPassword}
              onChange={(e) => setPw((s) => ({ ...s, currentPassword: e.target.value }))}
              autoComplete="current-password"
            />
          </label>
          <label className="block">
            <span className="label">New</span>
            <input
              className="input"
              type="password"
              value={pw.newPassword}
              onChange={(e) => setPw((s) => ({ ...s, newPassword: e.target.value }))}
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="label">Confirm</span>
            <input
              className="input"
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw((s) => ({ ...s, confirm: e.target.value }))}
              autoComplete="new-password"
            />
          </label>
        </div>
        <button type="submit" disabled={savingPw} className="btn-primary">
          {savingPw ? 'Updating…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
