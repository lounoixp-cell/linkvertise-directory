'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert } from 'lucide-react';

export function triggerSecurityShield(customMessage?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('security-shield-trigger', {
        detail: { message: customMessage || 'This file is secured. Downloading or copying is prohibited.' },
      })
    );
  }
}

export default function SecurityShield() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    // 1. Listen for custom dispatch events
    const handleCustomTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      showToast(customEvent.detail?.message || 'This file is secured. Downloading or copying is prohibited.');
    };

    window.addEventListener('security-shield-trigger', handleCustomTrigger);

    // 2. Global contextmenu prevention on images & media
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isImageOrProtected =
        target.tagName === 'IMG' ||
        target.tagName === 'PICTURE' ||
        target.closest('img') ||
        target.closest('[data-protected="image"]') ||
        target.closest('article') ||
        target.closest('[data-component="post-card"]');

      if (isImageOrProtected) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });

    // 3. Screenshot and Save/Print keyboard shortcut interception
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // PrintScreen key
      if (e.key === 'PrintScreen' || key === 'printscreen') {
        e.preventDefault();
        showToast('Screen capture is restricted on this protected content.');
        return;
      }

      // Save shortcuts (Ctrl+S, Cmd+S)
      if (isCmdOrCtrl && key === 's') {
        e.preventDefault();
        showToast('Saving this protected file is disabled.');
        return;
      }

      // Print shortcuts (Ctrl+P, Cmd+P)
      if (isCmdOrCtrl && key === 'p') {
        e.preventDefault();
        showToast('Printing this protected content is disabled.');
        return;
      }

      // DevTools shortcuts (F12, Ctrl+Shift+I, Cmd+Opt+I, Ctrl+Shift+C, Cmd+Opt+C)
      if (
        e.key === 'F12' ||
        (isCmdOrCtrl && e.shiftKey && (key === 'i' || key === 'c' || key === 'j')) ||
        (e.metaKey && e.altKey && (key === 'i' || key === 'c' || key === 'j'))
      ) {
        e.preventDefault();
        showToast('This file is secured.');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('security-shield-trigger', handleCustomTrigger);
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [showToast]);

  if (!toastMessage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border border-red-500/40 bg-neutral-900/95 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200"
      onClick={() => setToastMessage(null)}
    >
      <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
      <span>{toastMessage}</span>
    </div>
  );
}
