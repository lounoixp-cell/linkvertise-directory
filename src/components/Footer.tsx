'use client';

import { useFeedback } from '@/components/FeedbackContext';

export default function Footer() {
  const { openFeedback } = useFeedback();

  return (
    <footer className="mt-20 border-t border-neutral-900 bg-black text-xs text-neutral-500">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>&copy; {new Date().getFullYear()} Linkvertise Directory. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            data-action="feedback"
            aria-haspopup="dialog"
            aria-label="Send feedback"
            onClick={openFeedback}
            className="min-h-[44px] px-2 py-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none underline underline-offset-4 flex items-center"
          >
            Feedback
          </button>
          <p className="text-neutral-600">Links point strictly to external destinations.</p>
        </div>
      </div>
    </footer>
  );
}
