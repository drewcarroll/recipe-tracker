import type { Metadata, Viewport } from 'next';
import { Fraunces, Mulish } from 'next/font/google';
import type { ReactNode } from 'react';

import { UserProvider } from './_components/user-context';
import './globals.css';

/**
 * Type pairing (task: "a font that makes more sense for a recipe app"):
 * Fraunces — a warm, editorial "old-style" serif — for display/headings and the
 * brand, giving the app a cookbook feel; Mulish — a clean humanist sans — for
 * body and UI so long ingredient/step text stays highly readable. Both are
 * self-hosted by next/font (no runtime network) and exposed as CSS variables.
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const mulish = Mulish({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Recipe Tracker',
  description: 'Track, scale and cook your recipes.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en" className={`${fraunces.variable} ${mulish.variable}`}>
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
