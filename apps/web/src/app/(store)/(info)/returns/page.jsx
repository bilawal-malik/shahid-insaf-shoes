import InfoShell, { InfoSection } from '@/components/store/InfoShell';

export const metadata = {
  title: 'Returns & Exchange',
  description: 'Exchange policy at SIS — 7 days on unused items in original condition.',
  alternates: { canonical: '/returns' },
};

export default function ReturnsPage() {
  return (
    <InfoShell title="Returns & Exchange" subtitle="Simple, fair policies — no fine print games.">
      <InfoSection heading="Exchange window">
        <p>
          You can request an exchange within <strong>7 days of delivery</strong> for items that are
          unused and in original condition (box/packaging included where applicable).
        </p>
      </InfoSection>

      <InfoSection heading="How to request an exchange">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Contact us via phone, WhatsApp or the contact form with your order number.</li>
          <li>Tell us the issue and the size/pair you would like instead (subject to stock).</li>
          <li>We will confirm and arrange the exchange pickup/return.</li>
        </ol>
      </InfoSection>

      <InfoSection heading="What can be exchanged">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Wrong size ordered — exchange for a better-fitting size</li>
          <li>Different model/color — price difference applies</li>
          <li>Damaged or defective pair — priority exchange or refund per case</li>
          <li>Wrong item delivered — we fix it, including return shipping</li>
        </ul>
      </InfoSection>

      <InfoSection heading="What cannot be exchanged">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Items worn outdoors, washed, altered or damaged after delivery</li>
          <li>Requests after the 7-day window (contact us anyway — we try to be reasonable)</li>
        </ul>
      </InfoSection>

      <InfoSection heading="Refunds">
        <p>
          In eligible cases, refunds are issued to your original payment method (or as agreed for
          COD orders) within 7-10 working days after we receive and check the returned pair.
        </p>
      </InfoSection>
    </InfoShell>
  );
}
