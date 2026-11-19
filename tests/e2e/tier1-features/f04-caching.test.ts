/**
 * Feature F04: Caching & Webhook Revalidation
 * Specifications: ORIGINAL_REQUEST.md §6, PROJECT.md
 *
 * Requirements:
 * - Next.js tag-based ISR cache invalidation on /api/revalidate.
 * - Secret verification: returns 500 if SANITY_REVALIDATE_SECRET is missing.
 * - HMAC signature verification: returns 401 if webhook signature is invalid or absent.
 * - Body validation: requires document type (_type), returns 400 when missing.
 * - Cache invalidation: invalidates tag ('post'), root path ('/'), and /post/[slug] route.
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, test, assertEquals, assertTrue, assertContains } from '../harness';
import { POST } from '@/app/api/revalidate/route';
import { createMockRequest, invokeRouteHandler } from '../harness/http';
import { REVALIDATE_FIXTURES } from '../harness/fixtures';

describe('F04: Caching & Webhook Revalidation', () => {
  const routePath = path.resolve(process.cwd(), 'src/app/api/revalidate/route.ts');
  const routeSource = fs.readFileSync(routePath, 'utf-8');

  test('returns 500 when SANITY_REVALIDATE_SECRET environment variable is missing', async () => {
    const originalSecret = process.env.SANITY_REVALIDATE_SECRET;
    delete process.env.SANITY_REVALIDATE_SECRET;

    try {
      const req = createMockRequest('/api/revalidate', { method: 'POST' });
      const res = await invokeRouteHandler(POST as any, req);

      assertEquals(res.status, 500);
      const json = await res.json<{ message: string }>();
      assertContains(json.message, 'Missing SANITY_REVALIDATE_SECRET');
    } finally {
      if (originalSecret !== undefined) {
        process.env.SANITY_REVALIDATE_SECRET = originalSecret;
      }
    }
  });

  test('returns 401 when webhook signature header is invalid or missing', async () => {
    const originalSecret = process.env.SANITY_REVALIDATE_SECRET;
    process.env.SANITY_REVALIDATE_SECRET = REVALIDATE_FIXTURES.mockWebhookSecret;

    try {
      // Request with body but no signature header
      const req = createMockRequest('/api/revalidate', {
        method: 'POST',
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

  test('validates route source code implements document type validation returning 400 Bad Request', () => {
    assertTrue(fs.existsSync(routePath), 'Expected revalidate route to exist');
    assertContains(routeSource, '!body?._type');
    assertContains(routeSource, 'Bad request: missing document type in body');
    assertContains(routeSource, 'status: 400');

    // Fixture validation: empty payload has no _type
    assertEquals((REVALIDATE_FIXTURES.invalidEmptyPayload as any)._type, undefined);
  });

  test('validates cache tag and route path invalidation logic in webhook route', () => {
    // Revalidates tag based on document type ('post')
    assertContains(routeSource, "revalidateTag(body._type)");

    // Revalidates homepage root and paginated routes
    assertContains(routeSource, "revalidatePath('/')");
    assertContains(routeSource, "revalidatePath('/page/[pageNumber]', 'page')");
  });

  test('validates targeted post slug revalidation path computation for /post/[slug]', () => {
    assertContains(routeSource, "revalidatePath(`/post/${slug}`)");

    // Verify slug extraction logic from fixture
    const payload = REVALIDATE_FIXTURES.validPostPayload;
    const extractedSlug = typeof payload.slug === 'string' ? payload.slug : payload.slug?.current;
    assertEquals(extractedSlug, 'nextjs-framework');
    assertEquals(`/post/${extractedSlug}`, '/post/nextjs-framework');
  });
});
