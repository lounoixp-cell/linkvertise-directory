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

        {/* Linkvertise Full Script Monetization
            Strategy: load the library, then poll until window.linkvertise is defined before
            calling it. This avoids the DOMContentLoaded race condition in Next.js SSG/SSR
            where the event fires before the afterInteractive script has a chance to load.
            Once the library is ready we call it AND dispatch DOMContentLoaded so the
            script's internal async link-scanner runs immediately on the current DOM.
        */}
        <Script
          id="linkvertise-script"
          src="https://publisher.linkvertise.com/cdn/linkvertise.js"
          strategy="afterInteractive"
        />
        <Script id="linkvertise-init" strategy="afterInteractive">
          {`
            (function() {
              var PUBLISHER_ID = 964094;
              var OPTIONS = { whitelist: [], blacklist: ["xoohub.vercel.app"] };

              function activateLinkvertise() {
                if (typeof window.linkvertise !== 'function') return false;
                window.linkvertise(PUBLISHER_ID, OPTIONS);
                try { document.dispatchEvent(new Event('DOMContentLoaded')); } catch(e) {}
                return true;
              }

              // Poll until the library script is ready (max 5 seconds, every 100ms).
              var attempts = 0;
              function poll() {
                if (activateLinkvertise()) return;
                if (++attempts < 50) setTimeout(poll, 100);
              }
              poll();
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
