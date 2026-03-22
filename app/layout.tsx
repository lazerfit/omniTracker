import type { Metadata } from 'next';
import './globals.css';
import Header from '../components/web/layout/Header';
import Sidebar from '../components/web/layout/Sidebar';
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
        className="bg-background text-foreground flex h-dvh w-full antialiased"
      >
        <Providers>
          <Sidebar />
          <div className="flex h-full min-w-0 flex-1 flex-col">
            <Header />
            <main className="h-full w-full overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
          </div>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
