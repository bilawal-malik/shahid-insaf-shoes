import { api } from '@/lib/api';
import CheckoutView from '@/components/store/checkout/CheckoutView';

export const metadata = {
  title: 'Checkout',
  robots: { index: false, follow: true },
};

export default async function CheckoutPage() {
  const config = await api('/config', { next: { revalidate: 60 } }).catch(() => null);
  return <CheckoutView config={config} />;
}
