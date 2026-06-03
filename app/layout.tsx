/**
 * ONE TWO — Root layout with fonts
 * Caminho: app/layout.tsx
 */
import type { Metadata } from 'next';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';
import './globals.css';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const sans = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ONE TWO · crafted pieces',
  description: 'Plataforma administrativa para a marca ONE TWO — slow fashion atelier.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/one-two-logo.png',
    apple: '/one-two-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
