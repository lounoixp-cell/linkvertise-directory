'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import { useFeedback } from './FeedbackContext';
import { FeedbackUIStatus } from '@/types/feedback';

interface FeedbackModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function FeedbackModal({ isOpen: isOpenProp, onClose: onCloseProp }: FeedbackModalProps) {
  let contextOpen = false;
  let contextClose = () => {};

  try {
    const ctx = useFeedback();
    contextOpen = ctx.isOpen;
    contextClose = ctx.closeFeedback;
  } catch {
    // Graceful fallback if rendered outside FeedbackProvider
  }

  const isModalOpen = isOpenProp !== undefined ? isOpenProp : contextOpen;
  const closeModal = onCloseProp !== undefined ? onCloseProp : contextClose;

  const pathname = usePathname();
  const [pageUrl, setPageUrl] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [hpVal, setHpVal] = useState('');
  const [status, setStatus] = useState<FeedbackUIStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);
  const prevActiveElementRef = useRef<HTMLElement | null>(null);

  // Sync pageUrl on path change or modal open
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(window.location.href);
    } else {
      setPageUrl(pathname || '/');
    }
  }, [pathname, isModalOpen]);

  // Focus trap and keyboard dismiss listeners
  useEffect(() => {
    if (!isModalOpen) return;

    prevActiveElementRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseModal();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on message textarea or first focusable element
    const initialTarget = modalRef.current?.querySelector<HTMLElement>('#message, textarea, input, button');
    if (initialTarget && typeof initialTarget.focus === 'function') {
      initialTarget.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (prevActiveElementRef.current && typeof prevActiveElementRef.current.focus === 'function') {
        prevActiveElementRef.current.focus();
      }
    };
  }, [isModalOpen, status]);

  const handleCloseModal = () => {
    if (status === 'submitting') return;
    if (status === 'success') {
      setStatus('idle');
    }
    closeModal();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current || status === 'submitting') {
      return;
    }

    // 1. Whitespace or empty message check
    if (!message || message.trim() === '') {
      setErrorMessage('Message is required and cannot be empty.');
      setStatus('error');
      return;
    }

    // 2. Message length check
    if (message.length > 2000) {
      setErrorMessage('Message must be 2000 characters or less.');
      setStatus('error');
      return;
    }

    // 3. Email validation (completely optional)
    if (email && email.trim() !== '') {
      if (/[\r\n]/.test(email)) {
        setErrorMessage('Invalid characters in email address (CRLF prohibited).');
        setStatus('error');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorMessage('Please provide a valid email address or leave the field blank.');
        setStatus('error');
        return;
      }
    }

    // 4. Name validation
    if (name && /[\r\n]/.test(name)) {
      setErrorMessage('Invalid characters in name (CRLF prohibited).');
      setStatus('error');
      return;
    }

    isSubmittingRef.current = true;
    setStatus('submitting');
    setErrorMessage('');

    try {
      const currentUrl = pageUrl || (typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000/');
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          email: email.trim() || undefined,
          name: name.trim() || undefined,
          pageUrl: currentUrl,
          hp_val: hpVal || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setStatus('error');
        setErrorMessage(data?.error || 'Failed to send feedback. Please check your connection and try again.');
        return;
      }

      setStatus('success');
      setMessage('');
      setName('');
      setEmail('');
      setHpVal('');
    } catch {
      setStatus('error');
      setErrorMessage('Failed to send feedback. Please check your connection and try again.');
    } finally {
      isSubmittingRef.current = false;
    }
  };

  if (!isModalOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 id="feedback-title" className="text-base font-bold text-white">
              Content Removal Request
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Request the removal of a listing or external link.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            data-action="close"
            onClick={handleCloseModal}
            className="text-neutral-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {status === 'success' ? (
          <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-6 text-center space-y-3 mt-4">
            <h3 className="text-base font-bold text-emerald-400">Request Submitted</h3>
            <p className="mt-2 text-sm text-neutral-300">Thank you. Your content removal request has been received and will be reviewed promptly.</p>
            <button
              type="button"
              data-action="close"
              onClick={handleCloseModal}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 rounded min-h-[44px] min-w-[44px]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Honeypot field for anti-spam bot suppression */}
            <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
              <label htmlFor="hp_val">Leave this field blank</label>
              <input
                type="text"
                id="hp_val"
                name="hp_val"
                tabIndex={-1}
                autoComplete="off"
                value={hpVal}
                onChange={(e) => setHpVal(e.target.value)}
              />
            </div>

            {/* Context pageUrl */}
            <input type="hidden" name="pageUrl" value={pageUrl} />

            {/* Error Alert Box */}
            {errorMessage ? (
              <div
                role="alert"
                className="rounded-lg border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-300 flex items-center justify-between gap-2"
              >
                <span>{errorMessage}</span>
                <button
                  type="button"
                  data-action="dismiss-alert"
                  aria-label="Dismiss error"
                  onClick={() => setErrorMessage('')}
                  className="text-red-300 hover:text-white p-1 text-sm font-bold min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  &times;
                </button>
              </div>
            ) : null}

            <div>
              <label htmlFor="name" className="block text-xs font-medium text-neutral-400">
                Name (optional)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status === 'submitting'}
                placeholder="Name (optional)"
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="email" className="block text-xs font-medium text-neutral-400">
                  Email <span className="text-neutral-500 font-normal">(optional)</span>
                </label>
                <span className="text-[11px] text-neutral-500">Anonymous by default</span>
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'submitting'}
                placeholder="your@email.com (optional)"
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Leave blank to submit anonymously, or provide if you would like a reply.
              </p>
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-medium text-neutral-400">
                Removal Details / URL <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                maxLength={2000}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={status === 'submitting'}
                placeholder="Please specify the post URL or title and the reason for removal (e.g. copyright holder, dead link, DMCA)..."
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                data-action="cancel"
                onClick={handleCloseModal}
                disabled={status === 'submitting'}
                className="min-h-[44px] min-w-[44px] px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors flex items-center justify-center rounded-lg hover:bg-neutral-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-btn"
                disabled={status === 'submitting'}
                aria-busy={status === 'submitting' ? 'true' : undefined}
                className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" data-icon="spinner" />
                    <span>Submitting...</span>
                  </>
                ) : errorMessage ? (
                  'Retry Submit'
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
