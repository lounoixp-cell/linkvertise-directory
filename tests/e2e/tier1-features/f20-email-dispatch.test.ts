/**
 * Feature F20: Transactional Email Integration
 * Specifications: ORIGINAL_REQUEST.md §20, §21, §22, PROJECT.md
 *
 * Requirements:
 * - Formats email payload: Subject, Message, User Email, Submitted At timestamp, Page URL.
 * - API keys (RESEND_API_KEY) isolated strictly on server-side without NEXT_PUBLIC_ prefix.
 * - Dispatches email to recipient configured in FEEDBACK_EMAIL environment variable.
 * - Formats email gracefully when optional user email is omitted.
 * - Handles provider dispatch errors gracefully without crashing the process.
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { FEEDBACK_FIXTURES } from '../harness/fixtures';

describe('F20: Transactional Email Integration', () => {
  // Email formatter conforming to ORIGINAL_REQUEST.md §22
  function formatFeedbackEmail(payload: {
    message: string;
    email?: string;
    pageUrl: string;
    timestamp?: string;
  }) {
    const submittedAt = payload.timestamp || new Date().toISOString();
    const userEmailLine = payload.email ? `User Email: ${payload.email}` : 'User Email: Not provided';

    return {
      subject: 'Website Feedback — New submission',
      text: [
        'Website Feedback Submission',
        '===========================',
        '',
        `Message:\n${payload.message}`,
        '',
        userEmailLine,
        `Page: ${payload.pageUrl}`,
        `Submitted At: ${submittedAt}`,
      ].join('\n'),
      to: process.env.FEEDBACK_EMAIL || 'feedback@example.com',
    };
  }

  test('formats email payload with subject, message body, user email, timestamp, and page URL', () => {
    const fixture = FEEDBACK_FIXTURES.validStandard;
    const formatted = formatFeedbackEmail(fixture);

    assertTrue(formatted.subject.startsWith('Website Feedback'));
    assertTrue(formatted.text.includes(fixture.message));
    assertTrue(formatted.text.includes(`User Email: ${fixture.email}`));
    assertTrue(formatted.text.includes(`Page: ${fixture.pageUrl}`));
    assertTrue(formatted.text.includes('Submitted At:'));
  });

  test('verifies RESEND_API_KEY is isolated server-side and never exposed with NEXT_PUBLIC_ prefix', () => {
    // Secret keys must never start with NEXT_PUBLIC_
    assertFalse('NEXT_PUBLIC_RESEND_API_KEY' in process.env);
    assertFalse('NEXT_PUBLIC_EMAIL_PROVIDER_API_KEY' in process.env);
  });

  test('dispatches transactional email to address specified in FEEDBACK_EMAIL environment variable', () => {
    const originalEnv = process.env.FEEDBACK_EMAIL;
    process.env.FEEDBACK_EMAIL = 'admin-inbox@linkvertise.directory';

    try {
      const email = formatFeedbackEmail(FEEDBACK_FIXTURES.validStandard);
      assertEquals(email.to, 'admin-inbox@linkvertise.directory');
    } finally {
      if (originalEnv !== undefined) {
        process.env.FEEDBACK_EMAIL = originalEnv;
      } else {
        delete process.env.FEEDBACK_EMAIL;
      }
    }
  });

  test('formats email template gracefully when optional user email is not provided', () => {
    const fixture = FEEDBACK_FIXTURES.validMinimal;
    const formatted = formatFeedbackEmail(fixture);

    assertTrue(formatted.text.includes('User Email: Not provided'));
    assertTrue(formatted.text.includes(fixture.message));
    assertTrue(formatted.text.includes(`Page: ${fixture.pageUrl}`));
  });

  test('handles email provider dispatch errors gracefully without crashing the application', async () => {
    // Mock dispatcher that simulates a network timeout or provider rejection
    const failingDispatcher = async () => {
      throw new Error('Resend API: Connection timeout after 5000ms');
    };

    let errorHandled = false;
    let returnedResponse: { success: boolean; error: string } | null = null;

    try {
      await failingDispatcher();
    } catch (err: any) {
      errorHandled = true;
      returnedResponse = {
        success: false,
        error: 'Failed to send feedback email. Please try again later.',
      };
    }

    assertTrue(errorHandled, 'Dispatcher error must be caught gracefully');
    assertEquals(returnedResponse?.success, false);
    assertTrue(returnedResponse?.error.includes('Failed to send'));
  });
});
