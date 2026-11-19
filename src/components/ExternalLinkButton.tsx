'use client';

import React from 'react';
import { validateExternalUrl } from '@/lib/url-shield';

interface ExternalLinkButtonProps {
  externalUrl: string;
  destinationDomain?: string;
  postTitle?: string;
}

export default function ExternalLinkButton({ externalUrl }: ExternalLinkButtonProps) {
  const validation = validateExternalUrl(externalUrl);
  const targetUrl = validation.isValid && validation.sanitizedUrl ? validation.sanitizedUrl : externalUrl;

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
    <div className="py-2 inline-block">
      {/* 
        Interactive Tap Target:
        - Appears visually as a raw, bold red clickable URL matching the reference design.
        - Rendered as a button rather than a native <a href> to prevent "Copy link address" context menus.
        - Enforces select-none and blocks copy/cut/drag/contextmenu events so users can only tap/click.
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
        aria-label="Open destination link"
        className="text-red-500 hover:text-red-400 font-bold text-base sm:text-lg break-all underline underline-offset-4 text-left select-none [-webkit-user-select:none] [-webkit-touch-callout:none] cursor-pointer bg-transparent border-none p-0 inline transition-colors focus:outline-none"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        {targetUrl}
      </button>
    </div>
  );
}
