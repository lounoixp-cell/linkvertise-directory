'use client';

import { useState } from 'react';
import { ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { validateExternalUrl } from '@/lib/url-shield';

interface ExternalLinkButtonProps {
  externalUrl: string;
  destinationDomain: string;
  postTitle: string;
}

export default function ExternalLinkButton({
  externalUrl,
  destinationDomain,
  postTitle,
}: ExternalLinkButtonProps) {
  const [status, setStatus] = useState<'idle' | 'opening' | 'error'>('idle');

  // Validate the URL using the security utility
  const validation = validateExternalUrl(externalUrl);

  const handleOpenLink = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!validation.isValid || !validation.sanitizedUrl) {
      setStatus('error');
      return;
    }

    setStatus('opening');

    setTimeout(() => {
      // Safe window.open with strict noopener and noreferrer
      const newWindow = window.open(validation.sanitizedUrl!, '_blank', 'noopener,noreferrer');
      if (newWindow) {
        newWindow.opener = null;
      }
      setStatus('idle');
    }, 250);
  };

  const isInvalid = !validation.isValid || status === 'error';

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 sm:p-7 shadow-2xl backdrop-blur-sm text-center">
        <h3 className="text-sm sm:text-base font-semibold text-neutral-300">
          Access Content for: <span className="text-white font-bold">{postTitle}</span>
        </h3>

        <p className="mt-1 text-xs text-neutral-400">
          Hosted externally on: <span className="font-semibold text-neutral-200">{destinationDomain}</span>
        </p>

        {/* 
          External Link Action Button:
          - Prevents text selection
          - Disables right-click context menu
          - Hides raw destination URL from plain text view
        */}
        <div className="mt-6 flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={handleOpenLink}
            onContextMenu={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            disabled={status === 'opening'}
            className="no-select group relative inline-flex w-full sm:w-auto min-h-[44px] min-w-[260px] items-center justify-center gap-2.5 rounded-xl bg-red-600 hover:bg-red-500 px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-red-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-neutral-400 cursor-pointer disabled:opacity-60"
            aria-label="Open external destination link"
          >
            {status === 'opening' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Redirecting Safely...</span>
              </>
            ) : (
              <>
                <span>OPEN EXTERNAL LINK</span>
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </>
            )}
          </button>

          <span className="mt-3 text-[11px] text-neutral-500 flex items-center gap-1 select-none">
            Opens in a secure new tab &bull; Safe verified HTTPS link
          </span>
        </div>

        {/* Security / Error Warning State */}
        {isInvalid && (
          <div
            role="alert"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Link unavailable.</span>
          </div>
        )}
      </div>
    </div>
  );
}
