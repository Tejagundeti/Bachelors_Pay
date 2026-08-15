import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BachelorsPay - Manage Room Finances',
  description:
    'The smartest way for roommates to split expenses, track bills, and manage shared finances. No more awkward money conversations.',
  keywords: [
    'roommate finance',
    'split expenses',
    'shared wallet',
    'bill tracking',
    'UPI payments',
  ],
  openGraph: {
    title: 'BachelorsPay - Manage Room Finances',
    description:
      'The smartest way for roommates to split expenses, track bills, and manage shared finances.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-[#F8FAFC] text-[#0F172A]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
