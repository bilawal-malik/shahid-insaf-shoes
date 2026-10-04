import OrderDetailView from '@/components/admin/OrderDetailView';

export const metadata = { title: 'Order detail' };

export default async function AdminOrderPage({ params }) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}
