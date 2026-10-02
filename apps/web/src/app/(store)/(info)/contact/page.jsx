import { api } from '@/lib/api';
import InfoShell, { InfoSection } from '@/components/store/InfoShell';
import ContactForm from './ContactForm';

export const metadata = {
  title: 'Contact Us',
  description: 'Call, WhatsApp or send a message — SIS support for orders, sizing and exchange.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const config = await api('/config', { next: { revalidate: 300 } }).catch(() => null);
  const store = config?.store || {};
  const whatsapp = (store.whatsapp || store.phone || '').replace(/[^\d]/g, '');

  return (
    <InfoShell
      title="Contact Us"
      subtitle="We usually reply within one working day."
      wide
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <p>
            Questions about sizing, an order or an exchange? Send us a message or reach out
            directly — we are happy to help.
          </p>
          <ContactForm />
        </div>

        <aside className="space-y-4">
          {store.phone && (
            <div className="rounded-xl bg-surface p-4">
              <p className="text-sm font-semibold text-ink">Phone / WhatsApp</p>
              <a
                href={`tel:${store.phone}`}
                className="mt-1 block text-sm text-brand-700 hover:text-brand-800"
              >
                {store.phone}
              </a>
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm font-medium text-green-700 hover:text-green-800"
                >
                  Chat on WhatsApp →
                </a>
              )}
            </div>
          )}
          {store.email && (
            <div className="rounded-xl bg-surface p-4">
              <p className="text-sm font-semibold text-ink">Email</p>
              <a
                href={`mailto:${store.email}`}
                className="mt-1 block text-sm text-brand-700 hover:text-brand-800"
              >
                {store.email}
              </a>
            </div>
          )}
          {store.address && (
            <div className="rounded-xl bg-surface p-4">
              <p className="text-sm font-semibold text-ink">Address</p>
              <p className="mt-1 text-sm text-ink-soft">{store.address}</p>
            </div>
          )}
          {!store.phone && !store.email && !store.address && (
            <div className="rounded-xl bg-surface p-4 text-sm text-ink-soft">
              Contact details are being updated — please use the form.
            </div>
          )}
        </aside>
      </div>

      <InfoSection heading="Order help">
        <p>
          For order status, use the <strong>Track Order</strong> page with your order number and
          phone number.
        </p>
      </InfoSection>
    </InfoShell>
  );
}
