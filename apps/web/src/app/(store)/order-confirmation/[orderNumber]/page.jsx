import OrderConfirmationView from './OrderConfirmationView';

export const metadata = {
  title: 'Order confirmation',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OrderConfirmationView />;
}
