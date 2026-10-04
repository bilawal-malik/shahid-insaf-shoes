import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, MessageCircle, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { waMeLink } from '@/lib/phone';

export default function Footer({ config, categories = [] }) {
  const store = config?.store;
  const whatsapp = waMeLink(store?.whatsapp || store?.phone);
  const year = new Date().getFullYear();

  const helpLinks = [
    { href: '/faq', label: 'FAQ' },
    { href: '/shipping', label: 'Shipping & Delivery' },
    { href: '/returns', label: 'Returns & Exchange' },
    { href: '/track-order', label: 'Track Order' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/about', label: 'About Us' },
  ];

  const bottomLinks = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ];

  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="border-b border-white/10">
        <div className="container-app grid grid-cols-3 gap-4 py-6 text-center sm:grid-cols-3">
          {[
            { icon: Truck, label: 'Cash on Delivery' },
            { icon: ShieldCheck, label: 'Quality Guaranteed' },
            { icon: RotateCcw, label: '7-Day Exchange' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <Icon className="h-5 w-5 text-brand-300" aria-hidden />
              <span className="text-xs font-medium text-brand-100">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="container-app grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white">
              <Image
                src="/logo.jpeg"
                alt="Shahid Insaf Shoes"
                width={36}
                height={36}
                className="h-full w-full object-contain"
              />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-white">
              Shahid Insaf Shoes
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-300">
            {store?.tagline ||
              'Handcrafted sandals, Peshawari chappals and shoes. Quality you can trust, delivered all over Pakistan.'}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <FooterLink href="/products">All Products</FooterLink>
            </li>
            {categories.map((cat) => (
              <li key={cat._id}>
                <FooterLink href={`/categories/${cat.slug}`}>{cat.name}</FooterLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Help</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {helpLinks.map((link) => (
              <li key={link.href}>
                <FooterLink href={link.href}>{link.label}</FooterLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Contact</p>
          <ul className="mt-4 space-y-3 text-sm text-brand-300">
            {store?.phone && (
              <li>
                <a
                  href={`tel:${store.phone}`}
                  className="flex items-center gap-2.5 hover:text-white"
                >
                  <Phone className="h-4 w-4 shrink-0" /> {store.phone}
                </a>
              </li>
            )}
            {store?.email && (
              <li>
                <a
                  href={`mailto:${store.email}`}
                  className="flex items-center gap-2.5 hover:text-white"
                >
                  <Mail className="h-4 w-4 shrink-0" /> {store.email}
                </a>
              </li>
            )}
            {store?.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {store.address}
              </li>
            )}
            {whatsapp && (
              <li>
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-white"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp
                </a>
              </li>
            )}
            <li className="pt-1">
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-brand-200">
                Mon - Sat · 10am - 8pm
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-app flex flex-col items-center justify-between gap-3 py-5 text-xs text-brand-400 sm:flex-row">
          <p>© {year} SIS — Shahid Insaf Shoes. All rights reserved.</p>
          <div className="flex gap-5">
            {bottomLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }) {
  return (
    <Link href={href} className="text-brand-300 transition-colors hover:text-white">
      {children}
    </Link>
  );
}
