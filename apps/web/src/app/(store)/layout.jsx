import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import { ToastProvider } from '@/components/ui/Toast';
import { api } from '@/lib/api';

async function getLayoutData() {
  try {
    const [config, categories] = await Promise.all([
      api('/config', { next: { revalidate: 60 } }),
      api('/categories', { next: { revalidate: 60 } }),
    ]);
    return { config, categories: categories.items || [] };
  } catch {
    return { config: null, categories: [] };
  }
}

export default async function StoreLayout({ children }) {
  const { config, categories } = await getLayoutData();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header config={config} categories={categories} />
      <main className="flex-1">
        <ToastProvider>{children}</ToastProvider>
      </main>
      <Footer config={config} categories={categories} />
    </div>
  );
}
