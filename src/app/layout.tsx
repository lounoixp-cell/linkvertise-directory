import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FeedbackProvider } from '@/components/FeedbackContext';
import FeedbackModal from '@/components/FeedbackModal';

export const metadata: Metadata = {
  title: 'Linkvertise Directory — Minimal Link Listing Site',
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
        </FeedbackProvider>
      </body>
    </html>
  );
}
