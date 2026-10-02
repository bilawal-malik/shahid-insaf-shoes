import InfoShell, { InfoSection } from '@/components/store/InfoShell';

export const metadata = {
  title: 'Terms & Conditions',
  description: 'Terms of use and sale for the SIS online store.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <InfoShell title="Terms & Conditions" subtitle="Last updated: October 2026.">
      <InfoSection heading="Using this store">
        <p>
          By using this website you agree to these terms. If you do not agree, please do not use
          the store. You must provide accurate information when placing an order.
        </p>
      </InfoSection>

      <InfoSection heading="Orders & pricing">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>All prices are in Pakistani Rupees (PKR)</li>
          <li>An order is confirmed once we verify it; we may cancel orders with clear pricing
            errors or stock issues (with a full explanation)</li>
          <li>Stock is confirmed at the time of packing; rare double-sales are handled per the
            exchange policy</li>
        </ul>
      </InfoSection>

      <InfoSection heading="Payment">
        <p>
          Payment is Cash on Delivery unless otherwise stated. You pay the courier when you
          receive your parcel.
        </p>
      </InfoSection>

      <InfoSection heading="Delivery & exchange">
        <p>
          Delivery timelines are estimates. Exchanges follow our{' '}
          <a href="/returns" className="font-medium text-brand-700 hover:text-brand-800">
            Returns &amp; Exchange policy
          </a>
          , which forms part of these terms.
        </p>
      </InfoSection>

      <InfoSection heading="Product information">
        <p>
          We photograph and describe products honestly, but colors may vary slightly by screen.
          Sizes follow standard Pakistani/EU fittings.
        </p>
      </InfoSection>

      <InfoSection heading="Liability">
        <p>
          Our liability for any claim is limited to the value of the order in question. Nothing in
          these terms limits rights you have under applicable consumer law.
        </p>
      </InfoSection>

      <InfoSection heading="Changes">
        <p>
          We may update these terms from time to time. Continued use of the store after changes
          means you accept the updated terms.
        </p>
      </InfoSection>
    </InfoShell>
  );
}
