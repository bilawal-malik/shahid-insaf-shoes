import { Inter } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'SIS - Shahid Insaf Shoes';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Peshawari Chappals & Footwear Pakistan`,
    template: `%s | ${siteName}`,
  },
  description:
    'SIS - Shahid Insaf Shoes. Premium local Pakistani sandals, Peshawari chappals and shoes. Cash on delivery all over Pakistan.',
  applicationName: siteName,
  openGraph: {
    type: 'website',
    siteName,
    url: siteUrl,
    locale: 'en_PK',
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f5f7fa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
