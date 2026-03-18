import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '../components/web/layout/Header';
import Sidebar from '../components/web/layout/Sidebar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground flex h-dvh w-full antialiased`}
      >
        <Sidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <Header />
          <main className="h-full w-full overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
