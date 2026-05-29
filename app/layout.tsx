import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SwiftDrop — Ad-Free Video Downloader',
  description: 'Clean, lightning fast, and ad-free video downloader for YouTube and Twitter/X.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body suppressHydrationWarning className="bg-[#0a0a0a] text-white min-h-screen antialiased selection:bg-[#7C3AED]/30 selection:text-purple-200">
        {children}
      </body>
    </html>
  );
}
