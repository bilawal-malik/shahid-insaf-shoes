import Image from 'next/image';
import InfoShell, { InfoSection } from '@/components/store/InfoShell';

export const metadata = {
  title: 'About Us',
  description:
    'SIS — Shahid Insaf Shoes: handcrafted Peshawari chappals, sandals and shoes from Pakistan, delivered with cash on delivery nationwide.',
  alternates: { canonical: '/about' },
};

const VALUES = [
  { title: 'Honest craftsmanship', text: 'Every pair is finished with careful quality checks before it ships.' },
  { title: 'Fair, honest pricing', text: 'Quality footwear at prices that make sense for Pakistani families.' },
  { title: 'Nationwide COD', text: 'Cash on delivery across Pakistan — pay only when the pair is in your hands.' },
];

export default function AboutPage() {
  return (
    <InfoShell
      title="About SIS"
      subtitle="Shahid Insaf Shoes — quality footwear, delivered nationwide."
    >
      <div className="relative aspect-[16/7] overflow-hidden rounded-xl bg-brand-100/60">
        <Image
          src="https://images.unsplash.com/photo-1449505278894-297fdb3edbc1"
          alt="Craftsman working with leather footwear"
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
          priority
        />
      </div>

      <InfoSection heading="Our story">
        <p>
          SIS — Shahid Insaf Shoes started with a simple idea: reliable, well-made footwear for
          everyday Pakistan. From Peshawari chappals to light summer sandals, we focus on pairs
          people actually wear — to work, to the mosque, to family events — and wear for years.
        </p>
        <p>
          We work with experienced craftsmen, select durable materials, and keep our catalogue
          tight so we can stand behind every product we sell.
        </p>
      </InfoSection>

      <InfoSection heading="What we stand for">
        <div className="grid gap-4 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-sm font-semibold text-ink">{v.title}</p>
              <p className="mt-1.5 text-sm text-ink-soft">{v.text}</p>
            </div>
          ))}
        </div>
      </InfoSection>

      <InfoSection heading="How we work">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Quality-checked products, honest photos and descriptions</li>
          <li>Cash on delivery, 3-5 day delivery across Pakistan</li>
          <li>7-day exchange on unused items</li>
          <li>Real people on phone and WhatsApp if you need help</li>
        </ul>
      </InfoSection>
    </InfoShell>
  );
}
