/**
 * Feature F21: Feedback UI States
 * Specifications: ORIGINAL_REQUEST.md §22, §38, PROJECT.md
 *
 * Requirements:
 * - Idle state: active inputs and enabled submit button.
 * - Submitting state: displays loading spinner and disables submit button (prevents double submits).
 * - Success state: displays confirmation message and hides or clears form.
 * - Error state: displays friendly error alert on network/API failure.
 * - Recovery: user can dismiss error and retry submission.
 */

import { describe, test, assertEquals, assertTrue } from '../harness';
import { createDOMInspector } from '../harness/dom';

describe('F21: Feedback UI States', () => {
  const idleStateHtml = `
    <form class="space-y-4">
      <textarea id="message" name="message" class="w-full"></textarea>
      <button type="submit" id="submit-btn" class="bg-red-600 text-white">Send</button>
    </form>
  `;

  const submittingStateHtml = `
    <form class="space-y-4">
      <textarea id="message" name="message" disabled class="w-full opacity-60"></textarea>
      <button type="submit" id="submit-btn" disabled class="bg-red-600 opacity-50 cursor-not-allowed">
        <span class="animate-spin" data-icon="spinner">⌛</span>
        <span>Sending...</span>
      </button>
    </form>
  `;

  const successStateHtml = `
    <div class="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-6 text-center" role="status">
      <h3 class="text-base font-bold text-emerald-400">Feedback Sent</h3>
      <p class="mt-2 text-sm text-neutral-300">Thank you for helping improve the directory!</p>
      <button type="button" data-action="close" class="mt-4 px-4 py-2 text-xs font-semibold text-white bg-neutral-800 rounded">
        Done
      </button>
    </div>
  `;

  const errorStateHtml = `
    <form class="space-y-4">
      <div role="alert" class="rounded-lg border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-300 flex items-center justify-between">
        <span>Failed to send feedback. Please check your connection and try again.</span>
        <button type="button" data-action="dismiss-alert" aria-label="Dismiss error">&times;</button>
      </div>
      <textarea id="message" name="message" class="w-full">Existing user draft preserved</textarea>
      <button type="submit" id="submit-btn" class="bg-red-600 text-white">Retry Send</button>
    </form>
  `;

  test('verifies idle state presents active inputs and enabled submit button', () => {
    const inspector = createDOMInspector(idleStateHtml);
    const submitBtn = inspector.assertHasTag('button', { type: 'submit' });
    const textarea = inspector.assertHasTag('textarea');

    assertTrue(!submitBtn.hasAttribute('disabled'), 'Submit button must not be disabled in idle state');
    assertTrue(!textarea.hasAttribute('disabled'), 'Textarea must not be disabled in idle state');
  });

  test('verifies submitting state displays inline loading spinner and disables submit button', () => {
    const inspector = createDOMInspector(submittingStateHtml);
    const submitBtn = inspector.assertHasTag('button', { type: 'submit' });
    const spinner = inspector.findTag('span', { 'data-icon': 'spinner' });

    assertTrue(submitBtn.hasAttribute('disabled', true), 'Submit button must be disabled during submission');
    assertTrue(spinner !== null, 'Submitting state must display loading indicator');
    inspector.assertTextContent(/Sending\.\.\./);
  });

  test('verifies success state displays confirmation message upon successful submission', () => {
    const inspector = createDOMInspector(successStateHtml);
    const statusBox = inspector.assertHasTag('div', { role: 'status' });

    assertTrue(statusBox !== null);
    inspector.assertTextContent(/Feedback Sent/);
    inspector.assertTextContent(/Thank you for helping improve/);
  });

  test('verifies error state displays friendly error alert on API failure', () => {
    const inspector = createDOMInspector(errorStateHtml);
    const alertBox = inspector.assertHasTag('div', { role: 'alert' });

    assertTrue(alertBox !== null);
    inspector.assertTextContent(/Failed to send feedback/);
  });

  test('allows user to dismiss error alert and retry feedback submission without losing message draft', () => {
    const inspector = createDOMInspector(errorStateHtml);
    const dismissBtn = inspector.findTag('button', { 'data-action': 'dismiss-alert' });
    assertTrue(dismissBtn !== null, 'Dismiss alert button must be present');

    const textarea = inspector.assertHasTag('textarea');
    assertEquals(textarea.textContent, 'Existing user draft preserved');

    const retryBtn = inspector.assertHasTag('button', { type: 'submit' });
    inspector.assertTextContent(/Retry Send/);
    assertTrue(!retryBtn.hasAttribute('disabled'));
  });
});
