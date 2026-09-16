import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: { default: 'FixMyBusiness AI — Améliorez votre site avec méthode', template: '%s · FixMyBusiness AI' },
  description: 'Analysez les éléments publics de votre site et transformez les problèmes détectés en actions concrètes.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: { title: 'FixMyBusiness AI', description: 'Un audit web clair, actionnable et transparent.', type: 'website' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><Header />{children}<Footer /></body></html>;
}
