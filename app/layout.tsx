import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';

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
        <div>
          <Sidebar />
        </div>
        <div className="flex h-full w-full flex-col">
          <Header />
          <main className="bg-card flex h-full w-full items-center justify-center overflow-auto rounded-tl-4xl rounded-bl-4xl p-8 pt-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
