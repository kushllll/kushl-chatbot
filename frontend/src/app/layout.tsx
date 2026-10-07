import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kushalchatai.netlify.app'),
  title: 'Kushal Chat AI',
  description: 'Fast, intelligent, and responsive AI assistant',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/Neon%20Orbital%20Sphere%20Emblem.png', type: 'image/png' },
    ],
    apple: [
      { url: '/Neon%20Orbital%20Sphere%20Emblem.png' },
    ],
  },
  openGraph: {
    title: 'Kushal Chat AI',
    description: 'Fast, intelligent, and responsive AI assistant',
    url: 'https://kushalchatai.netlify.app',
    siteName: 'Kushal Chat AI',
    images: [
      {
        url: '/Neon%20Orbital%20Sphere%20Emblem.png',
        width: 877,
        height: 877,
        alt: 'Kushal Chat AI',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Kushal Chat AI',
    description: 'Fast, intelligent, and responsive AI assistant',
    images: ['/Neon%20Orbital%20Sphere%20Emblem.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kushal Chat AI',
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full dark antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className="h-full bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800">
        {children}
      </body>
    </html>
  );
}
