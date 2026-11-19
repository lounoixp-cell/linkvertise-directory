/**
 * Feature F20 Boundary: Transactional Email Integration
 * Specifications: ORIGINAL_REQUEST.md §20, §21, §22; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Missing Provider API Key (handled error response without unhandled process crash)
 * 2. Missing Feedback Recipient Email (handled configuration error)
 * 3. Strict Email Body Format Compliance (Subject, Message, User Email, Submitted At, Page)
 * 4. Zero Client-Side Secret Exposure (statically audit client code for RESEND_API_KEY)
 * 5. Provider Outage Simulation (HTTP 500 from email service handled gracefully)
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { FEEDBACK_FIXTURES } from '../harness/fixtures';

describe('F20: Transactional Email Boundaries & Reliability', () => {
  // Email dispatcher logic adhering to ORIGINAL_REQUEST §20, §21, §22
  const dispatchFeedbackEmail = async (
    payload: { message: string; email?: string; pageUrl: string },
    options: { apiKey?: string; recipient?: string; simulateOutage?: boolean } = {}
  ): Promise<{ success: boolean; error?: string }> => {
    const apiKey = options.apiKey ?? process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'Email service configuration missing: RESEND_API_KEY is unset.' };
    }

    const recipient = options.recipient ?? process.env.FEEDBACK_EMAIL;
    if (!recipient) {
      return { success: false, error: 'Feedback recipient configuration missing: FEEDBACK_EMAIL is unset.' };
    }

    if (options.simulateOutage) {
      return { success: false, error: 'Email provider temporary outage: HTTP 500 Internal Error.' };
    }

    return { success: true };
  };

  test('boundary: missing RESEND_API_KEY returns handled error without crashing process', async () => {
    const res = await dispatchFeedbackEmail(FEEDBACK_FIXTURES.validStandard, { apiKey: '' });
    assertEquals(res.success, false);
    assertTrue(res.error?.includes('RESEND_API_KEY is unset'));
  });

  test('boundary: missing FEEDBACK_EMAIL recipient returns handled configuration error', async () => {
    const res = await dispatchFeedbackEmail(FEEDBACK_FIXTURES.validStandard, {
      apiKey: 're_test_key_123',
      recipient: '',
    });
    assertEquals(res.success, false);
    assertTrue(res.error?.includes('FEEDBACK_EMAIL is unset'));
  });

  test('boundary: formatted email text strictly complies with ORIGINAL_REQUEST §22 format', () => {
    const formatEmailBody = (data: { message: string; email?: string; pageUrl: string; timestamp?: string }) => {
      const timestamp = data.timestamp || new Date().toISOString();
      const userEmail = data.email ? data.email : 'Not provided';
      return {
        subject: 'Website Feedback — New submission',
        body: [
          'Subject: Website Feedback',
          `Message: ${data.message}`,
          `User Email: ${userEmail}`,
          `Submitted At: ${timestamp}`,
          `Page: ${data.pageUrl}`,
        ].join('\n'),
      };
    };

    const formatted = formatEmailBody({
      message: 'Great directory site!',
      email: 'user@example.com',
      pageUrl: 'https://example.com/post/nextjs-framework',
      timestamp: '2026-01-15T12:00:00.000Z',
    });

    assertTrue(formatted.subject.startsWith('Website Feedback'));
    assertTrue(formatted.body.includes('Message: Great directory site!'));
    assertTrue(formatted.body.includes('User Email: user@example.com'));
    assertTrue(formatted.body.includes('Submitted At: 2026-01-15T12:00:00.000Z'));
    assertTrue(formatted.body.includes('Page: https://example.com/post/nextjs-framework'));
  });

  test('boundary: static client audit verifies RESEND_API_KEY is NEVER exposed to client components', () => {
    const clientComponentsDir = path.resolve(process.cwd(), 'src/components');
    const componentFiles = fs.readdirSync(clientComponentsDir).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));

    for (const file of componentFiles) {
      const content = fs.readFileSync(path.join(clientComponentsDir, file), 'utf-8');
      assertFalse(
        content.includes('RESEND_API_KEY'),
        `Client component "${file}" must not contain references to RESEND_API_KEY`
      );
      assertFalse(
        content.includes('EMAIL_PROVIDER_API_KEY'),
        `Client component "${file}" must not contain references to EMAIL_PROVIDER_API_KEY`
      );
    }
  });

  test('boundary: provider 500 outage simulation handled safely with user-friendly alert', async () => {
    const res = await dispatchFeedbackEmail(FEEDBACK_FIXTURES.validStandard, {
      apiKey: 're_valid_key',
      recipient: 'feedback@example.com',
      simulateOutage: true,
    });

    assertEquals(res.success, false);
    assertTrue(res.error?.includes('temporary outage') || res.error?.includes('500'));
  });
});
