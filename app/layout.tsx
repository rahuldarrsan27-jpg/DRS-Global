import type { Metadata, Viewport } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Archivo({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const DESCRIPTION =
  'DRS Global is a multi-sector engineering and business solutions group delivering integrated capability across engineering, infrastructure, logistics, renewable energy, industrial solutions, construction supply chains and digital transformation.';

export const metadata: Metadata = {
  metadataBase: new URL('https://drsglobal.info'),
  title: {
    default: 'DRS Global — Engineering Industries. Connecting Markets. Enabling Growth.',
    template: '%s — DRS Global',
  },
  description: DESCRIPTION,
  applicationName: 'DRS Global',
  keywords: [
    'engineering group',
    'industrial solutions',
    'renewable energy EPC',
    'solar EPC',
    'logistics and freight forwarding',
    'construction materials supply',
    'digital transformation',
    'electrical engineering',
    'testing and commissioning',
    'multi-sector engineering',
  ],
  authors: [{ name: 'DRS Global' }],
  openGraph: {
    type: 'website',
    title: 'DRS Global — Engineering Industries. Connecting Markets. Enabling Growth.',
    description: DESCRIPTION,
    siteName: 'DRS Global',
    locale: 'en',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DRS Global',
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  themeColor: '#05060a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * Structured data. The site is a single continuous experience with no
 * sub-pages, so the organisation and its service catalogue are described here
 * for crawlers that will never scroll the journey.
 *
 * Deliberately contains no claims — no founding date, no address, no awards,
 * no project counts. Capability only.
 */
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'DRS Global',
  description: DESCRIPTION,
  slogan: 'Engineering Industries. Connecting Markets. Enabling Growth.',
  url: 'https://drsglobal.info',
  email: 'admin@drsglobal.info',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'admin@drsglobal.info',
      telephone: '+918072822140',
    },
    {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'admin@drsglobal.info',
      telephone: '+919344416928',
    },
  ],
  makesOffer: [
    'Digital Transformation',
    'Industrial Solutions',
    'Construction',
    'Logistics',
    'Renewable Energy',
    'Engineering',
  ].map((name) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name, provider: { '@type': 'Organization', name: 'DRS Global' } },
  })),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {children}
      </body>
    </html>
  );
}
