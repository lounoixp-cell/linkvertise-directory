'use client';

import React from 'react';
import { LockOpen } from 'lucide-react';
import { validateExternalUrl } from '@/lib/url-shield';

interface ExternalLinkButtonProps {
  externalUrl: string;
  destinationDomain?: string;
  postTitle?: string;
}

export default function ExternalLinkButton({ externalUrl }: ExternalLinkButtonProps) {
  const validation = validateExternalUrl(externalUrl);
  const targetUrl = validation.isValid && validation.sanitizedUrl ? validation.sanitizedUrl : null;

  const handleOpenLink = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!targetUrl || targetUrl.trim() === '') return;

    // Secure navigation without exposing native anchor href
    const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (win) {
      win.opener = null;
    }
  };

  const preventCopyAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
    <div className="py-2 inline-block w-full sm:w-auto">
      {/* 
        Interactive Tap Target:
        - Renders as a high-converting, styled action button matching site luxury aesthetic.
        - Button element blocks DevTools anchor inspection and 'Copy link address' menus.
        - Enforces select-none and blocks copy/cut/drag/contextmenu events.
      */}
      <button
        type="button"
        role="link"
        onClick={handleOpenLink}
        onContextMenu={preventCopyAction}
        onCopy={preventCopyAction}
        onCut={preventCopyAction}
        onDragStart={preventCopyAction}
        onMouseDown={(e) => {
          // Prevent text highlighting on double/triple click
          if (e.detail > 1) e.preventDefault();
        }}
        aria-label="Tap for Access"
        className="group relative flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-red-600 px-7 py-3.5 text-base sm:text-lg font-bold text-white shadow-lg shadow-red-950/60 transition-all duration-200 hover:bg-red-500 hover:shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500 select-none [-webkit-user-select:none] [-webkit-touch-callout:none] cursor-pointer border border-red-500/30"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        <LockOpen className="h-5 w-5 text-white/90 group-hover:scale-110 transition-transform" />
        <span>Tap for Access</span>
        <span className="text-white/80 group-hover:translate-x-1 transition-transform">&rarr;</span>
      </button>
    </div>
  );
}
