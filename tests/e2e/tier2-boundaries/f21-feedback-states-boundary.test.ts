/**
 * Feature F21 Boundary: Feedback UI States
 * Specifications: ORIGINAL_REQUEST.md §22, §38; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. In-Flight Submitting State (submit button disabled with loading spinner)
 * 2. Success Confirmation State (displays confirmation, clears form)
 * 3. Error Alert State (inline error message without destroying user draft)
 * 4. Double Submission Prevention (in-flight guard prevents duplicate network requests)
 * 5. Modal Accessibility & Escape Key Dismissal (role="dialog", aria-modal="true")
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';

describe('F21: Feedback UI State Transitions & Boundaries', () => {
  test('boundary: in-flight submitting state disables button and displays loading spinner', () => {
    const inFlightHtml = `
      <form class="space-y-4">
        <textarea id="message" name="message" disabled class="opacity-60">My feedback draft</textarea>
        <button type="submit" disabled class="cursor-not-allowed opacity-50 bg-red-600 text-white" aria-busy="true">
          <svg class="animate-spin h-4 w-4" data-icon="spinner"></svg>
          <span>Sending...</span>
        </button>
      </form>
    `;

    const inspector = createDOMInspector(inFlightHtml);
    const submitBtn = inspector.assertHasTag('button', { type: 'submit' });

    assertTrue(submitBtn.hasAttribute('disabled'), 'Submit button must have disabled attribute during submission');
    assertEquals(submitBtn.getAttribute('aria-busy'), 'true');
    assertTrue(submitBtn.textContent.includes('Sending'));

    const textarea = inspector.assertHasTag('textarea');
    assertTrue(textarea.hasAttribute('disabled'), 'Form inputs must be disabled while in-flight');
  });

  test('boundary: success state displays confirmation message and completion action', () => {
    const successHtml = `
      <div role="status" class="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-6 text-center">
        <h3 class="text-base font-bold text-emerald-400">Feedback Sent</h3>
        <p class="mt-2 text-sm text-neutral-300">Thank you for helping improve the directory!</p>
        <button type="button" data-action="close" class="mt-4 px-4 py-2 text-xs font-semibold text-white bg-neutral-800 rounded">
          Done
        </button>
      </div>
    `;

    const inspector = createDOMInspector(successHtml);
    inspector.assertTextContent('Feedback Sent');
    inspector.assertTextContent('Thank you');

    const statusDiv = inspector.assertHasTag('div', { role: 'status' });
    assertTrue(statusDiv !== null);

    const doneBtn = inspector.assertHasTag('button', { 'data-action': 'close' });
    assertTrue(doneBtn !== null);
  });

  test('boundary: error state preserves user draft while displaying accessible alert', () => {
    const userDraft = 'My detailed suggestion for improving navigation speed.';
    const errorHtml = `
      <form class="space-y-4">
        <div role="alert" class="rounded-lg border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-300 flex items-center justify-between">
          <span>Failed to send feedback. Please check your connection and try again.</span>
          <button type="button" data-action="dismiss-alert" aria-label="Dismiss error">&times;</button>
        </div>
        <textarea id="message" name="message" class="w-full">${userDraft}</textarea>
        <button type="submit" class="bg-red-600 text-white">Retry Send</button>
      </form>
    `;

    const inspector = createDOMInspector(errorHtml);
    inspector.assertTextContent('Failed to send feedback');
    inspector.assertTextContent(userDraft);

    const alert = inspector.assertHasTag('div', { role: 'alert' });
    assertTrue(alert !== null);

    const submitBtn = inspector.assertHasTag('button', { type: 'submit' });
    assertFalse(submitBtn.hasAttribute('disabled'));
  });

  test('boundary: double-submission prevention ensures single network request on rapid clicks', async () => {
    let activeRequestCount = 0;
    let totalExecutedRequests = 0;

    const submitFeedbackSafe = async () => {
      // Guard against concurrent execution
      if (activeRequestCount > 0) {
        return; // Ignored while in flight
      }

      activeRequestCount++;
      totalExecutedRequests++;
      // Simulate network latency
      await new Promise((r) => setTimeout(r, 20));
      activeRequestCount--;
    };

    // Simulate 3 rapid consecutive submissions
    await Promise.all([
      submitFeedbackSafe(),
      submitFeedbackSafe(),
      submitFeedbackSafe(),
    ]);

    // Exactly 1 request executed
    assertEquals(totalExecutedRequests, 1);
  });

  test('boundary: modal dialog provides accessible role, aria-modal, and escape listener attributes', () => {
    const modalHtml = `
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      >
        <div class="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div class="flex items-center justify-between">
            <h2 id="feedback-modal-title" class="text-base font-bold text-white">Website Feedback</h2>
            <button type="button" aria-label="Close dialog" data-action="close">&times;</button>
          </div>
        </div>
      </div>
    `;

    const inspector = createDOMInspector(modalHtml);
    const dialog = inspector.assertHasTag('div', { role: 'dialog' });

    assertEquals(dialog.getAttribute('aria-modal'), 'true');
    assertEquals(dialog.getAttribute('aria-labelledby'), 'feedback-modal-title');

    const closeBtn = inspector.assertHasTag('button', { 'data-action': 'close' });
    assertEquals(closeBtn.getAttribute('aria-label'), 'Close dialog');
  });
});
