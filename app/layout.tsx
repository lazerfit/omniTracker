import type { Metadata } from 'next';
import './globals.css';
import Providers from './Providers';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Omni Tracker',
  description: 'manage stocks and crypto in one place.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-background text-foreground antialiased"
      >
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
