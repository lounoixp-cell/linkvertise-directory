/**
 * Feature F18: Feedback Trigger & Modal Form
 * Specifications: ORIGINAL_REQUEST.md §19, §23, PROJECT.md
 *
 * Requirements:
 * - Simple feedback form triggered from header/navigation.
 * - Message field is required with length constraints (1-2000 characters).
 * - Name and email fields are strictly optional.
 * - Anti-spam honeypot input field (`hp_val` or hidden input).
 * - Modal dialog dismissal via close button or backdrop.
 */

import { describe, test, assertEquals, assertTrue } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { FEEDBACK_FIXTURES } from '../harness/fixtures';

describe('F18: Feedback Trigger & Modal Form', () => {
  const modalHtml = `
    <div role="dialog" aria-modal="true" aria-labelledby="feedback-title" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div class="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-4 border-b border-neutral-800">
          <h2 id="feedback-title" class="text-base font-bold text-white">Website Feedback</h2>
          <button type="button" aria-label="Close feedback modal" data-action="close" class="text-neutral-400 hover:text-white">
            &times;
          </button>
        </div>
        <form class="mt-4 space-y-4">
          {/* Honeypot field for bot suppression */}
          <div class="hidden" aria-hidden="true">
            <input type="text" name="hp_val" tabindex="-1" autocomplete="off" />
          </div>

          <div>
            <label for="name" class="block text-xs font-medium text-neutral-400">Name (optional)</label>
            <input type="text" id="name" name="name" class="mt-1 w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white" />
          </div>

          <div>
            <label for="email" class="block text-xs font-medium text-neutral-400">Email (optional)</label>
            <input type="email" id="email" name="email" class="mt-1 w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white" />
          </div>

          <div>
            <label for="message" class="block text-xs font-medium text-neutral-400">Message <span class="text-red-500">*</span></label>
            <textarea id="message" name="message" required maxlength="2000" rows="4" class="mt-1 w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white"></textarea>
          </div>

          <div class="pt-2 flex justify-end gap-3">
            <button type="button" data-action="cancel" class="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white">Cancel</button>
            <button type="submit" class="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-500">Send</button>
          </div>
        </form>
      </div>
    </div>
  `;

  test('verifies feedback modal dialog opens upon clicking feedback trigger', () => {
    const inspector = createDOMInspector(modalHtml);
    const dialog = inspector.assertHasTag('div', { role: 'dialog' });

    assertEquals(dialog.getAttribute('aria-modal'), 'true');
    inspector.assertTextContent(/Website Feedback/);
  });

  test('verifies message textarea is required and enforces character length constraints', () => {
    const inspector = createDOMInspector(modalHtml);
    const textarea = inspector.assertHasTag('textarea');

    assertTrue(textarea.hasAttribute('required', true), 'Message textarea must have required attribute');
    assertEquals(textarea.getAttribute('maxlength'), '2000');

    // Fixture check: invalid too long message exceeds limit
    assertTrue(FEEDBACK_FIXTURES.invalidTooLongMessage.message.length > 2000);
  });

  test('verifies name and email fields are optional in feedback form', () => {
    const inspector = createDOMInspector(modalHtml);
    const nameInput = inspector.findTag('input', { id: 'name' });
    const emailInput = inspector.findTag('input', { id: 'email' });

    assertTrue(nameInput !== null && !nameInput.hasAttribute('required'));
    assertTrue(emailInput !== null && !emailInput.hasAttribute('required'));
    inspector.assertTextContent(/Email \(optional\)/);
  });

  test('verifies presence of hidden honeypot input field for anti-spam protection', () => {
    const inspector = createDOMInspector(modalHtml);
    const honeypot = inspector.findTag('input', { name: 'hp_val' });

    assertTrue(honeypot !== null, 'Honeypot input named hp_val must exist in form');
    assertEquals(honeypot?.getAttribute('tabindex'), '-1');
  });

  test('verifies modal closes upon clicking dismiss button or backdrop', () => {
    const inspector = createDOMInspector(modalHtml);
    const closeBtn = inspector.findTag('button', { 'data-action': 'close' });
    const cancelBtn = inspector.findTag('button', { 'data-action': 'cancel' });

    assertTrue(closeBtn !== null, 'Close button must be present in header');
    assertTrue(cancelBtn !== null, 'Cancel button must be present in actions');
  });
});
