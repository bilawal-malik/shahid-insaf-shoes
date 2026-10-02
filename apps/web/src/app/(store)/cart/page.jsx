import { api } from '@/lib/api';
import CartView from '@/components/store/cart/CartView';

export const metadata = {
  title: 'Your Cart',
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  const config = await api('/config', { next: { revalidate: 60 } }).catch(() => null);
  return <CartView shipping={config?.shipping || null} />;
}
