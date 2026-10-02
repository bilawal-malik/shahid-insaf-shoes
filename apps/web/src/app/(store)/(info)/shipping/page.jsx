import { api } from '@/lib/api';
import InfoShell, { InfoSection } from '@/components/store/InfoShell';

export const metadata = {
  title: 'Shipping & Delivery',
  description: 'Delivery times, cash on delivery and shipping fees at SIS — 3-5 days across Pakistan.',
  alternates: { canonical: '/shipping' },
};

export default async function ShippingPage() {
  const config = await api('/config', { next: { revalidate: 300 } }).catch(() => null);
  const shipping = config?.shipping || {};
  const feeLabel = shipping.freeAbove
    ? `Rs ${shipping.flatRate.toLocaleString()} — FREE on orders over Rs ${shipping.freeAbove.toLocaleString()}`
    : `Rs ${(shipping.flatRate ?? 0).toLocaleString()}`;

  return (
    <InfoShell title="Shipping & Delivery" subtitle="How we get your order to your door.">
      <InfoSection heading="Delivery time">
        <p>
          Orders are dispatched quickly and normally arrive within{' '}
          <strong>{shipping.estimatedDays || '3-5'} working days</strong> across Pakistan. Major
          cities are usually at the faster end.
        </p>
      </InfoSection>

      <InfoSection heading="Shipping fee">
        <p>{feeLabel}</p>
        <p>The exact fee is shown at checkout before you place the order.</p>
      </InfoSection>

      <InfoSection heading="Cash on Delivery">
        <p>
          Pay the rider in cash when your parcel arrives. Please keep the exact amount ready where
          possible — it helps deliveries move faster.
        </p>
      </InfoSection>

      <InfoSection heading="Order tracking">
        <p>
          Once your order is placed, you can check live status on the{' '}
          <a href="/track-order" className="font-medium text-brand-700 hover:text-brand-800">
            Track Order
          </a>{' '}
          page using your order number and phone number.
        </p>
      </InfoSection>

      <InfoSection heading="Need help?">
        <p>
          If your order is delayed beyond the estimated window, contact us with your order number —
          see the <a href="/contact" className="font-medium text-brand-700 hover:text-brand-800">contact page</a>.
        </p>
      </InfoSection>
    </InfoShell>
  );
}
