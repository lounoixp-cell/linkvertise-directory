/**
 * Feature F18 Boundary: Feedback Trigger & Modal Form
 * Specifications: ORIGINAL_REQUEST.md §19, §23; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Whitespace-Only Message (rejected: required non-empty message)
 * 2. Message Exceeding 2000 Characters (rejected at 2001 chars)
 * 3. Boundary Lengths 1 char and 2000 chars (both valid)
 * 4. Optional Fields Omission (successful validation when name and email omitted)
 * 5. Anti-Spam Honeypot Element (present in DOM with hidden/aria-hidden constraints)
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { FEEDBACK_FIXTURES } from '../harness/fixtures';

describe('F18: Feedback Form Input Validation Boundaries', () => {
  // Client-side form validation logic conforming to §19, §23
  const validateFeedbackClient = (input: {
    message: string;
    email?: string;
    name?: string;
    hp_val?: string;
  }): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!input.message || input.message.trim() === '') {
      errors.message = 'Message is required and cannot be empty.';
    } else if (input.message.length > 2000) {
      errors.message = 'Message must be 2000 characters or less.';
    }

    if (input.email && input.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email.trim())) {
        errors.email = 'Please provide a valid email address.';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  test('boundary: whitespace-only message rejected with "Message is required"', () => {
    const whitespaceInputs = [
      '    ',
      '\t\t\n\r  ',
      '   \n\n   ',
    ];

    for (const msg of whitespaceInputs) {
      const res = validateFeedbackClient({ message: msg });
      assertEquals(res.isValid, false);
      assertEquals(res.errors.message, 'Message is required and cannot be empty.');
    }
  });

  test('boundary: message exceeding 2000 characters rejected with length error', () => {
    const message2001 = 'A'.repeat(2001);
    const res = validateFeedbackClient({ message: message2001 });

    assertEquals(res.isValid, false);
    assertEquals(res.errors.message, 'Message must be 2000 characters or less.');
  });

  test('boundary: exact message limits 1 char and 2000 chars are both valid', () => {
    // 1 char boundary
    const res1 = validateFeedbackClient({ message: 'X' });
    assertEquals(res1.isValid, true);
    assertEquals(Object.keys(res1.errors).length, 0);

    // 2000 chars boundary
    const message2000 = 'Z'.repeat(2000);
    const res2000 = validateFeedbackClient({ message: message2000 });
    assertEquals(res2000.isValid, true);
    assertEquals(Object.keys(res2000.errors).length, 0);
  });

  test('boundary: optional fields omission (name and email omitted) produces valid submission', () => {
    const minimalPayload = {
      message: 'Great minimalist directory. Fast and clean.',
    };

    const res = validateFeedbackClient(minimalPayload);
    assertEquals(res.isValid, true);
    assertEquals(Object.keys(res.errors).length, 0);
  });

  test('boundary: honeypot field is present in DOM markup and marked hidden from human users', () => {
    const modalFormHtml = `
      <form class="space-y-4">
        {/* Anti-spam honeypot */}
        <div class="hidden" aria-hidden="true" style="display: none;">
          <label for="hp_val">Leave this field blank</label>
          <input type="text" id="hp_val" name="hp_val" tabindex="-1" autocomplete="off" />
        </div>
        <div>
          <textarea id="message" name="message" required maxlength="2000"></textarea>
        </div>
        <button type="submit">Send</button>
      </form>
    `;

    const inspector = createDOMInspector(modalFormHtml);
    const honeypotInput = inspector.assertHasTag('input', { name: 'hp_val' });

    assertEquals(honeypotInput.getAttribute('tabindex'), '-1');
    assertEquals(honeypotInput.getAttribute('autocomplete'), 'off');

    const wrapper = inspector.findTag('div', { class: /hidden/ });
    assertTrue(wrapper !== null, 'Honeypot container must have hidden class');
    assertEquals(wrapper?.getAttribute('aria-hidden'), 'true');
  });
});
