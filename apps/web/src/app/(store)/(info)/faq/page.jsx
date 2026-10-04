import Link from 'next/link';
import InfoShell, { InfoSection } from '@/components/store/InfoShell';

export const metadata = {
  title: 'FAQ',
  description: 'Answers about shipping, payment, sizing, exchange and orders at SIS.',
  alternates: { canonical: '/faq' },
};

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'Orders are delivered in 3-5 working days across Pakistan. Bigger cities are usually on the faster end.',
  },
  {
    q: 'Do you offer Cash on Delivery?',
    a: 'Yes. Cash on Delivery is available nationwide — you pay the rider when the parcel arrives.',
  },
  {
    q: 'How do I choose the right size?',
    a: 'Our sizes are standard Pakistani/EU fittings (39-45). If you are between sizes, go one size up. Still unsure? Call or WhatsApp us with your usual size — we will guide you.',
  },
  {
    q: 'What is the exchange policy?',
    a: 'Exchange within 7 days for unused items in original condition. Contact us with your order number and we will arrange it.',
  },
  {
    q: 'Can I return an order?',
    a: 'Exchanges are supported for unused pairs. If something is wrong with your pair (defect or wrong item), contact us and we will make it right.',
  },
  {
    q: 'How can I track my order?',
    a: 'Use the Track Order page with your order number and phone number to see live status (Placed → Confirmed → Shipped → Delivered).',
  },
  {
    q: 'Do prices include taxes?',
    a: 'Displayed prices are final for COD — what you see is what you pay, plus the shipping fee shown at checkout.',
  },
];

export default function FaqPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <InfoShell
      title="Frequently Asked Questions"
      subtitle="Shipping, payment, sizing and orders — quick answers."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <div className="space-y-2.5">
        {FAQS.map((item) => (
          <details key={item.q} className="group rounded-lg border border-line px-4 py-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-ink">
              {item.q}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.a}</p>
          </details>
        ))}
      </div>

      <InfoSection heading="Still have a question?">
        <p>
          Reach us via phone or WhatsApp — details are on the{' '}
          <Link href="/contact" className="font-medium text-brand-700 hover:text-brand-800">
            contact page
          </Link>
          .
        </p>
      </InfoSection>
    </InfoShell>
  );
}
