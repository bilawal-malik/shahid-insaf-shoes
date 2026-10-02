import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function InfoShell({ title, subtitle, children, wide = false }) {
  return (
    <div className="container-app py-8 lg:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: title }]} />
      <div className={wide ? 'max-w-5xl' : 'max-w-3xl'}>
        <p className="kicker">Information</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>}
        <div className="card mt-6 space-y-6 p-5 text-sm leading-relaxed text-ink-soft sm:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}

export function InfoSection({ heading, children }) {
  return (
    <section>
      <h2 className="text-base font-bold text-ink">{heading}</h2>
      <div className="mt-2.5 space-y-2">{children}</div>
    </section>
  );
}
