import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { JsonLd } from '@/components/seo/json-ld';
import { I18nProvider } from '@/lib/i18n/context';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stepbystitch.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'StepByStitch - Crochet Pattern Reader, Interactive Checklist & Translator',
    template: '%s | StepByStitch',
  },
  description: 'Transform your crochet PDF patterns and screenshots into interactive, editable, and translatable checklists (US / UK / FR). Keep all your patterns privately accessible anywhere.',
  keywords: [
    'crochet pattern reader',
    'crochet pattern pdf',
    'translate crochet pattern english french',
    'crochet checklist',
    'crochet row counter',
    'amigurumi pattern',
    'crochet abbreviations us uk fr',
    'crochet pattern tracker',
    'crochet companion app',
  ],
  authors: [{ name: 'StepByStitch' }],
  creator: 'StepByStitch',
  publisher: 'StepByStitch',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'fr-FR': '/fr',
    },
  },
  openGraph: {
    title: 'StepByStitch - The Ultimate Interactive Crochet Pattern Companion',
    description: 'Import your crochet PDFs and photos: automatic row-by-row parsing, interactive checkboxes, custom notes, and instant crochet translation.',
    url: siteUrl,
    siteName: 'StepByStitch',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'StepByStitch - Smart Interactive Crochet Pattern Reader',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StepByStitch - Interactive Checklist & Crochet Pattern Translator',
    description: 'Transform your PDF and photo patterns into checkable steps with specialized technical translation in 1 click.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#F7F9F7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${sans.variable} ${serif.variable} scroll-smooth overflow-x-hidden`}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-yarn-50 text-yarn-900 font-sans antialiased flex flex-col selection:bg-sage-200 selection:text-sage-900 overflow-x-hidden max-w-full">
        <I18nProvider>
          <JsonLd />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
