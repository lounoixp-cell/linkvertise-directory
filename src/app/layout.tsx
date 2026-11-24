import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FeedbackProvider } from '@/components/FeedbackContext';
import FeedbackModal from '@/components/FeedbackModal';
import SecurityShield from '@/components/SecurityShield';

export const metadata: Metadata = {
  title: 'xoohub — Minimal Link Listing Site',
  description: 'A minimalist, fast-loading, content-first directory for curated web links and resources.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-black text-neutral-100 antialiased selection:bg-neutral-800 selection:text-white">
        <FeedbackProvider>
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
          <FeedbackModal />
          <SecurityShield />
        </FeedbackProvider>

        {/* Linkvertise Full Script Monetization */}
        <Script
          src="https://publisher.linkvertise.com/cdn/linkvertise.js"
          strategy="afterInteractive"
        />
        <Script id="linkvertise-init" strategy="afterInteractive">
          {`
            function runLinkvertise() {
              if (typeof window.linkvertise === 'function') {
                window.linkvertise(964094, { whitelist: [], blacklist: ["xoohub.vercel.app"] });
              }
            }
            runLinkvertise();
            window.addEventListener('load', runLinkvertise);
          `}
        </Script>
      </body>
    </html>
  );
}
