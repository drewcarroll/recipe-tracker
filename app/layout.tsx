import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { UserProvider } from './_components/user-context';
import './globals.css';

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
    <html lang="en">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
