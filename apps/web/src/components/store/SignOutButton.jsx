'use client';

import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function SignOutButton({ className = '' }) {
  const router = useRouter();

  async function signOut() {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      /* session may already be gone */
    }
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className={`transition-colors hover:bg-brand-50 hover:text-brand-700 ${className}`}
    >
      Sign out
    </button>
  );
}
