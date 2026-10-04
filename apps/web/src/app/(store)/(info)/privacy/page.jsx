import InfoShell, { InfoSection } from '@/components/store/InfoShell';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How SIS collects, uses and protects your personal information.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <InfoShell title="Privacy Policy" subtitle="Last updated: October 2026.">
      <InfoSection heading="Information we collect">
        <p>
          When you place an order or contact us, we collect the information needed to fulfil it:
          your name, phone number, delivery address, email (if provided), and order details. We also
          store basic technical data (browser, device) for security and performance.
        </p>
      </InfoSection>

      <InfoSection heading="How we use it">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>To process, deliver and support your orders</li>
          <li>To respond to your questions and exchange requests</li>
          <li>To improve the store and prevent fraud/abuse</li>
          <li>To send order-related messages (we do not spam)</li>
        </ul>
      </InfoSection>

      <InfoSection heading="Who we share it with">
        <p>
          We share only what is necessary with delivery partners to complete your shipment, and with
          service providers hosting our store (e.g. hosting and database providers). We do not sell
          your personal data.
        </p>
      </InfoSection>

      <InfoSection heading="Cookies">
        <p>
          We use essential cookies for the shopping cart and login session. These are required for
          the store to function.
        </p>
      </InfoSection>

      <InfoSection heading="Your rights">
        <p>
          You may request access to, correction of, or deletion of your personal data by contacting
          us. Order records may be retained where required for accounting and legal purposes.
        </p>
      </InfoSection>

      <InfoSection heading="Contact">
        <p>
          Questions about privacy? Reach us via the{' '}
          <a href="/contact" className="font-medium text-brand-700 hover:text-brand-800">
            contact page
          </a>
          .
        </p>
      </InfoSection>
    </InfoShell>
  );
}
