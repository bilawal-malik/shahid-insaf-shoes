import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { ToastProvider } from '@/components/ui/Toast';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: { default: 'Admin — SIS', template: '%s · Admin — SIS' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  const token = (await cookies()).get('sis_jwt')?.value;
  if (!token) redirect('/login?next=/admin');

  let role = null;
  try {
    const r = await api('/auth/admin-check', {
      headers: { Authorization: `Bearer ${token}` },
    });
    role = r.role;
  } catch {
    role = null;
  }
  if (role !== 'admin') redirect('/');

  return (
    <ToastProvider>
      <AdminShell>{children}</AdminShell>
    </ToastProvider>
  );
}
