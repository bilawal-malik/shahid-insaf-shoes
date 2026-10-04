import CustomerDetailView from '@/components/admin/CustomerDetailView';

export const metadata = { title: 'Customer detail' };

export default async function AdminCustomerPage({ params }) {
  const { id } = await params;
  return <CustomerDetailView customerId={id} />;
}
