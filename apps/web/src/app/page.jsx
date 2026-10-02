export default function HomePage() {
  return (
    <main className="container-app py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="badge bg-brand-100 text-brand-800">Phase 0 — Scaffold ready</span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          SIS — Shahid Insaf Shoes
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          Production e-commerce storefront is under construction. Documentation lives in{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">docs/</code>.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/products" className="btn-primary">
            Shop products
          </a>
          <a href="/admin" className="btn-outline">
            Admin panel
          </a>
        </div>
        <ul className="mt-10 grid gap-2 text-left text-sm text-ink-soft sm:grid-cols-2">
          <li className="card p-4">Cash on delivery across Pakistan</li>
          <li className="card p-4">Next.js + Express + MongoDB</li>
          <li className="card p-4">SEO & Core Web Vitals focused</li>
          <li className="card p-4">Vercel (web) + Railway (API)</li>
        </ul>
      </div>
    </main>
  );
}
