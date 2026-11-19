'use client';

import Link from 'next/link';
import { useFeedback } from '@/components/FeedbackContext';

export default function Header() {
  const { isOpen, openFeedback } = useFeedback();

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md"
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="min-h-[44px] min-w-[44px] flex items-center gap-2 group text-sm font-semibold tracking-tight text-white max-w-[70%] sm:max-w-none truncate"
          aria-label="Linkvertise Directory Home"
        >
          <span className="font-bold tracking-tight text-white text-base truncate">
            Linkvertise Directory
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-action="feedback"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-label="Send feedback"
            onClick={openFeedback}
            className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors flex items-center justify-center rounded-lg hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            Feedback
          </button>
        </div>
      </div>
    </header>
  );
}
