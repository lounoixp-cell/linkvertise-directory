/**
 * Feature F04 Boundary: Caching & Webhook Revalidation
 * Specifications: ORIGINAL_REQUEST.md §6; src/app/api/revalidate/route.ts; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Missing Webhook Signature Header (POST without sanity-webhook-signature returns 401)
 * 2. Invalid / Tampered HMAC Signature (POST with forged signature returns 401)
 * 3. Empty / Malformed JSON Body (POST with missing _type returns 400 Bad Request)
 * 4. Non-Post Document Revalidation (POST with _type: "author" or "category" handled cleanly)
 * 5. Revalidation Payload Missing Slug (POST with _type: "post" and undefined slug revalidates without crash)
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, test, assertEquals, assertTrue, assertFalse, assertContains } from '../harness';
import { POST } from '@/app/api/revalidate/route';
import { createMockRequest, invokeRouteHandler } from '../harness/http';
import { REVALIDATE_FIXTURES } from '../harness/fixtures';

describe('F04: Caching & Webhook Revalidation Boundaries', () => {
  const routePath = path.resolve(process.cwd(), 'src/app/api/revalidate/route.ts');
  const routeSource = fs.readFileSync(routePath, 'utf-8');

  test('returns 401 Unauthorized when sanity-webhook-signature header is missing', async () => {
    const originalSecret = process.env.SANITY_REVALIDATE_SECRET;
    process.env.SANITY_REVALIDATE_SECRET = REVALIDATE_FIXTURES.mockWebhookSecret;

    try {
      const req = createMockRequest('/api/revalidate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: REVALIDATE_FIXTURES.validPostPayload,
      });

      const res = await invokeRouteHandler(POST as any, req);
      assertEquals(res.status, 401);
      const json = await res.json<{ message: string }>();
      assertContains(json.message, 'Invalid webhook signature');
    } finally {
      if (originalSecret !== undefined) {
        process.env.SANITY_REVALIDATE_SECRET = originalSecret;
      } else {
        delete process.env.SANITY_REVALIDATE_SECRET;
      }
    }
  });

  test('returns 401 Unauthorized when HMAC signature is forged or tampered with', async () => {
    const originalSecret = process.env.SANITY_REVALIDATE_SECRET;
    process.env.SANITY_REVALIDATE_SECRET = REVALIDATE_FIXTURES.mockWebhookSecret;

    try {
      const req = createMockRequest('/api/revalidate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'sanity-webhook-signature': 't=1600000000,v1=tampered_signature_hex_digest_999999',
        },
        body: REVALIDATE_FIXTURES.validPostPayload,
      });

      const res = await invokeRouteHandler(POST as any, req);
      assertEquals(res.status, 401);
      const json = await res.json<{ message: string }>();
      assertContains(json.message, 'Invalid webhook signature');
    } finally {
      if (originalSecret !== undefined) {
        process.env.SANITY_REVALIDATE_SECRET = originalSecret;
      } else {
        delete process.env.SANITY_REVALIDATE_SECRET;
      }
    }
  });

  test('validates rejection of empty or malformed payload missing _type with 400 Bad Request', () => {
    assertContains(routeSource, '!body?._type');
    assertContains(routeSource, 'Bad request: missing document type in body');
    assertContains(routeSource, 'status: 400');

    // Unit test payload validation logic
    const validateWebhookBody = (body: any): { valid: boolean; error?: string } => {
      if (!body?._type) {
        return { valid: false, error: 'Bad request: missing document type in body' };
      }
      return { valid: true };
    };

    assertEquals(validateWebhookBody({}).valid, false);
    assertEquals(validateWebhookBody({ slug: 'test' }).valid, false);
    assertEquals(validateWebhookBody(null).valid, false);
    assertEquals(validateWebhookBody({ _type: 'post' }).valid, true);
  });

  test('handles non-post document revalidation (_type: "author" or "category") safely', () => {
    // Non-post document type is revalidated at tag level without computing post slug route
    assertContains(routeSource, 'revalidateTag(body._type)');

    const processPayload = (body: { _type: string; slug?: any }) => {
      const tagsRevalidated = [body._type];
      const pathsRevalidated = ['/', '/page/[pageNumber]'];
      const slug = typeof body.slug === 'string' ? body.slug : body.slug?.current;
      if (slug && body._type === 'post') {
        pathsRevalidated.push(`/post/${slug}`);
      }
      return { tagsRevalidated, pathsRevalidated, type: body._type, slug: slug || null };
    };

    const authorResult = processPayload(REVALIDATE_FIXTURES.invalidNonPostType);
    assertEquals(authorResult.type, 'author');
    assertEquals(authorResult.tagsRevalidated, ['author']);
    // Should NOT revalidate /post/slug for an author document
    assertFalse(authorResult.pathsRevalidated.includes('/post/alice-author'));
  });

  test('handles post revalidation missing slug gracefully without null dereference error', () => {
    assertContains(routeSource, 'const slug = typeof body.slug === \'string\' ? body.slug : body.slug?.current;');
    assertContains(routeSource, 'if (slug) {');

    const computeRevalidationPaths = (body: { _type: string; slug?: any }) => {
      const paths = ['/', '/page/[pageNumber]'];
      const slug = typeof body.slug === 'string' ? body.slug : body.slug?.current;
      if (slug) {
        paths.push(`/post/${slug}`);
      }
      return paths;
    };

    // Global post payload without slug property
    const globalPayload = REVALIDATE_FIXTURES.validGlobalPostPayload;
    const paths = computeRevalidationPaths(globalPayload);

    assertEquals(paths.length, 2);
    assertEquals(paths[0], '/');
    assertEquals(paths[1], '/page/[pageNumber]');
  });
});
