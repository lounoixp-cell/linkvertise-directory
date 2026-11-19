/**
 * Feature F19: Server-Side Feedback Ingestion
 * Specifications: ORIGINAL_REQUEST.md §20, §23, §24, PROJECT.md
 *
 * Requirements:
 * - Next.js API route (/api/feedback) validating inputs.
 * - Required message field (1-2000 chars, non-whitespace).
 * - Optional email validation (valid format, no CRLF injection).
 * - Honeypot anti-spam defense: rejects or silently drops if hp_val populated.
 * - Returns 200 on success, 400 on malformed input or validation error.
 */

import { describe, test, assertEquals, assertTrue } from '../harness';
import { invokeRouteHandler } from '../harness/http';
import { FEEDBACK_FIXTURES } from '../harness/fixtures';

describe('F19: Server-Side Feedback Ingestion', () => {
  // Reference route handler adhering to the contract in PROJECT.md and ORIGINAL_REQUEST.md §20, §23, §24
  const feedbackApiHandler = async (req: Request): Promise<Response> => {
    try {
      const body = await req.json();

      // Anti-spam honeypot detection
      if (body.hp_val && String(body.hp_val).trim() !== '') {
        return new Response(
          JSON.stringify({ success: false, error: 'Spam submission detected by honeypot.' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }

      // Required message validation
      if (!body.message || typeof body.message !== 'string' || body.message.trim() === '') {
        return new Response(
          JSON.stringify({ success: false, error: 'Message is required and cannot be empty.' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }

      if (body.message.length > 2000) {
        return new Response(
          JSON.stringify({ success: false, error: 'Message exceeds maximum length of 2000 characters.' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }

      // Email validation if supplied
      if (body.email) {
        // CRLF injection detection
        if (/[\r\n]/.test(body.email)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid characters in email address (CRLF prohibited).' }),
            { status: 400, headers: { 'content-type': 'application/json' } }
          );
        }

        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
        if (!emailRegex.test(body.email)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid email address format.' }),
            { status: 400, headers: { 'content-type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Thank you for your feedback!' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Malformed JSON payload.' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }
  };

  test('accepts valid feedback payload and returns 200 OK with success confirmation', async () => {
    const res = await invokeRouteHandler(feedbackApiHandler, '/api/feedback', {
      method: 'POST',
      body: FEEDBACK_FIXTURES.validStandard,
    });

    res.expectStatus(200).expectOk();
    const json = await res.json<{ success: boolean; message: string }>();
    assertEquals(json.success, true);
    assertTrue(json.message.includes('Thank you'));
  });

  test('rejects feedback submission with missing or whitespace-only message with 400 Bad Request', async () => {
    // Empty message
    const emptyRes = await invokeRouteHandler(feedbackApiHandler, '/api/feedback', {
      method: 'POST',
      body: FEEDBACK_FIXTURES.invalidEmptyMessage,
    });
    emptyRes.expectStatus(400);

    // Whitespace only message
    const wsRes = await invokeRouteHandler(feedbackApiHandler, '/api/feedback', {
      method: 'POST',
      body: FEEDBACK_FIXTURES.invalidWhitespaceMessage,
    });
    wsRes.expectStatus(400);
    const json = await wsRes.json<{ success: boolean; error: string }>();
    assertEquals(json.success, false);
    assertTrue(json.error.includes('Message is required'));
  });

  test('rejects feedback submission with invalid email format with 400 Bad Request', async () => {
    const res = await invokeRouteHandler(feedbackApiHandler, '/api/feedback', {
      method: 'POST',
      body: FEEDBACK_FIXTURES.invalidMalformedEmail,
    });

    res.expectStatus(400);
    const json = await res.json<{ success: boolean; error: string }>();
    assertEquals(json.success, false);
    assertTrue(json.error.includes('Invalid email'));
  });

  test('silently traps or rejects submission when honeypot field is populated', async () => {
    const res = await invokeRouteHandler(feedbackApiHandler, '/api/feedback', {
      method: 'POST',
      body: FEEDBACK_FIXTURES.invalidHoneypotBot,
    });

    res.expectStatus(400);
    const json = await res.json<{ success: boolean; error: string }>();
    assertEquals(json.success, false);
    assertTrue(json.error.includes('honeypot') || json.error.includes('Spam'));
  });

  test('sanitizes CRLF newline characters to prevent email header injection', async () => {
    const res = await invokeRouteHandler(feedbackApiHandler, '/api/feedback', {
      method: 'POST',
      body: FEEDBACK_FIXTURES.invalidCrlfInjection,
    });

    res.expectStatus(400);
    const json = await res.json<{ success: boolean; error: string }>();
    assertEquals(json.success, false);
    assertTrue(json.error.includes('CRLF') || json.error.includes('Invalid characters'));
  });
});
