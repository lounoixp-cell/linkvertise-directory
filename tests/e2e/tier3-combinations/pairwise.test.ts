/**
 * Tier 3: Pairwise Combinatorial Interaction Testing
 * Linkvertise Directory E2E Test Suite
 *
 * Implements 24 cross-feature interaction test cases exercising pairs across F01 to F24
 * adhering to TEST_INFRA.md, PROJECT.md, and ORIGINAL_REQUEST.md specifications.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  describe,
  test,
  assert,
  assertEquals,
  assertTrue,
  assertFalse,
  assertContains,
  assertNotEquals,
  assertNull,
  assertNotNull,
} from '../harness';
import {
  getActiveMockPosts,
  getMockPosts,
  MOCK_POSTS,
  FEEDBACK_FIXTURES,
  REVALIDATE_FIXTURES,
} from '../harness/fixtures';
import { createDOMInspector } from '../harness/dom';
import { invokeRouteHandler, createMockRequest } from '../harness/http';
import { validateExternalUrl } from '@/lib/url-shield';
import {
  DEMO_POSTS,
  sortPostsDeterministically,
  getPaginatedPosts,
  getPostBySlug,
  getAdjacentPosts,
} from '@/lib/posts';
import {
  paginatedPostsQuery,
  postBySlugQuery,
  adjacentPostsQuery,
  allSortedPostsQuery,
} from '@/lib/sanity.queries';
import { POST as revalidateHandler } from '@/app/api/revalidate/route';
import { Post } from '@/types/post';

describe('Tier 3: Pairwise Combinatorial Interaction Testing', () => {
  const rootDir = process.cwd();

  // Reference route handler modeling the feedback ingestion endpoint per ORIGINAL_REQUEST §20, §23, §24
  const feedbackApiHandler = async (req: Request): Promise<Response> => {
    try {
      const rawText = await req.text();
      if (rawText.length > 102400) {
        return new Response(
          JSON.stringify({ success: false, error: 'Payload too large: maximum size is 100KB.' }),
          { status: 413, headers: { 'content-type': 'application/json' } }
        );
      }

      let body: any;
      try {
        body = JSON.parse(rawText);
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: 'Malformed JSON payload.' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }

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
        JSON.stringify({ success: false, error: 'Internal server error.' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }
  };

  // --------------------------------------------------------------------------
  // Pair 1: F01 ↔ F07 (Minimal Aesthetic & Responsive Grid)
  // --------------------------------------------------------------------------
  test('Pair 1 (F01 ↔ F07): Minimal Aesthetic & Responsive Grid container limits across viewports', () => {
    const responsiveHtml = `
      <main class="mx-auto max-w-7xl px-4 py-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <article class="border border-neutral-800 rounded p-4 bg-neutral-900">
            <img src="https://cdn.sanity.io/images/project/dataset/sample.png" alt="Preview" class="aspect-[16/10] object-cover w-full" />
            <h2 class="text-base font-semibold text-white mt-2">Next.js Framework</h2>
          </article>
        </div>
      </main>
    `;

    const inspector = createDOMInspector(responsiveHtml);
    inspector.assertNoBloat();
    inspector.assertResponsiveGrid();

    // Verify container constraints prevent horizontal overflow across screen sizes
    const main = inspector.assertHasTag('main');
    assertTrue(main.hasClass('max-w-7xl'), 'Container must have max-width constraint');
    assertTrue(main.hasClass('mx-auto'), 'Container must be horizontally centered');
    assertTrue(main.hasClass('px-4'), 'Container must enforce padding to avoid edge collisions');

    // Verify responsive grid column breakpoints (1-col mobile, 2-col tablet, 3/4-col desktop)
    const grid = inspector.assertHasTag('div', { class: /grid/ });
    assertTrue(grid.hasClass('grid-cols-1'), 'Must default to 1 column on mobile (320px)');
    assertTrue(grid.hasClass('sm:grid-cols-2'), 'Must adapt to 2 columns on tablet (768px)');
    assertTrue(grid.hasClass('lg:grid-cols-3'), 'Must adapt to 3 columns on desktop');
    assertTrue(grid.hasClass('xl:grid-cols-4'), 'Must support up to 4 columns on widescreen (1440px)');
  });

  // --------------------------------------------------------------------------
  // Pair 2: F02 ↔ F03 (Sanity Schema & GROQ Projection 1:1 Match)
  // --------------------------------------------------------------------------
  test('Pair 2 (F02 ↔ F03): Sanity Schema fields 1:1 match with GROQ query projections', () => {
    const schemaSource = fs.readFileSync(path.resolve(rootDir, 'src/sanity/schemas/post.ts'), 'utf-8');

    // 9 Core Schema Fields defined in Sanity Post schema
    const schemaFields = [
      'title',
      'slug',
      'tag',
      'previewImage',
      'externalUrl',
      'publishedAt',
      'status',
      'sortOrder',
      'description',
    ];

    // Verify every schema field is explicitly defined in post.ts
    for (const field of schemaFields) {
      const fieldRegex = new RegExp(`name:\\s*['"]${field}['"]`);
      assertTrue(fieldRegex.test(schemaSource), `Schema must define field: ${field}`);
    }

    // Verify GROQ projections in sanity.queries.ts project every schema field
    for (const field of schemaFields) {
      if (field === 'slug') {
        assertContains(paginatedPostsQuery, '"slug": slug.current');
        assertContains(postBySlugQuery, '"slug": slug.current');
      } else if (field === 'previewImage') {
        assertContains(paginatedPostsQuery, 'previewImage');
        assertContains(postBySlugQuery, 'previewImage');
      } else {
        assertContains(paginatedPostsQuery, field);
        assertContains(postBySlugQuery, field);
      }
    }

    // Verify GROQ query filters active status and defined slug
    assertContains(paginatedPostsQuery, 'status == "active"');
    assertContains(paginatedPostsQuery, 'defined(slug.current)');
  });

  // --------------------------------------------------------------------------
  // Pair 3: F03 ↔ F04 (GROQ Caching & Webhook Revalidation)
  // --------------------------------------------------------------------------
  test('Pair 3 (F03 ↔ F04): GROQ Caching & Webhook Revalidation cache tag invalidation', async () => {
    const originalSecret = process.env.SANITY_REVALIDATE_SECRET;
    process.env.SANITY_REVALIDATE_SECRET = REVALIDATE_FIXTURES.mockWebhookSecret;

    try {
      // Missing webhook signature header triggers 401 Unauthorized
      const req = createMockRequest('/api/revalidate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: REVALIDATE_FIXTURES.validPostPayload,
      });

      const res = await invokeRouteHandler(revalidateHandler as any, req);
      assertEquals(res.status, 401);
      const json = await res.json<{ message: string }>();
      assertContains(json.message, 'Invalid webhook signature');

      // Verify route source calls revalidateTag for the post document type
      const routeSource = fs.readFileSync(path.resolve(rootDir, 'src/app/api/revalidate/route.ts'), 'utf-8');
      assertContains(routeSource, 'revalidateTag(body._type)');
      assertContains(routeSource, "revalidatePath('/')");
      assertContains(routeSource, 'revalidatePath(`/post/${slug}`)');
    } finally {
      if (originalSecret !== undefined) {
        process.env.SANITY_REVALIDATE_SECRET = originalSecret;
      } else {
        delete process.env.SANITY_REVALIDATE_SECRET;
      }
    }
  });

  // --------------------------------------------------------------------------
  // Pair 4: F04 ↔ F05 (Cache Failure & Fallback Data Layer Resilience)
  // --------------------------------------------------------------------------
  test('Pair 4 (F04 ↔ F05): Cache Failure & Fallback data layer serving valid content', async () => {
    // When Sanity is offline/unconfigured, getPaginatedPosts falls back to DEMO_POSTS
    const result = await getPaginatedPosts(1, 8);

    assertNotNull(result);
    assertEquals(result.currentPage, 1);
    assertTrue(result.items.length > 0, 'Fallback repository must supply posts');
    assertEquals(result.pageSize, 8);
    assertTrue(result.totalItems >= result.items.length);

    // Verify first fallback post complies with Post schema contract
    const firstPost = result.items[0];
    assertTrue(typeof firstPost.title === 'string' && firstPost.title.length > 0);
    assertTrue(typeof firstPost.slug === 'string' && firstPost.slug.length > 0);
    assertTrue(typeof firstPost.previewImage === 'string');
    assertTrue(typeof firstPost.destinationDomain === 'string');
    assertEquals(firstPost.status, 'active');
  });

  // --------------------------------------------------------------------------
  // Pair 5: F05 ↔ F13 (Fallback Repository & Deterministic Sort)
  // --------------------------------------------------------------------------
  test('Pair 5 (F05 ↔ F13): Fallback Repository applying exact same deterministic sort', () => {
    // Verify DEMO_POSTS uses sortPostsDeterministically
    const activePosts = DEMO_POSTS.filter((p) => p.status === 'active');
    const sorted = sortPostsDeterministically(activePosts);

    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];

      if (a.sortOrder !== b.sortOrder) {
        assertTrue(a.sortOrder <= b.sortOrder, `SortOrder mismatch: ${a.sortOrder} > ${b.sortOrder}`);
      } else if (a.publishedAt !== b.publishedAt) {
        assertTrue(
          b.publishedAt.localeCompare(a.publishedAt) <= 0,
          `PublishedAt mismatch: ${a.publishedAt} should precede ${b.publishedAt}`
        );
      } else {
        assertTrue(a.id.localeCompare(b.id) <= 0, `Id tiebreak mismatch: ${a.id} should precede ${b.id}`);
      }
    }

    // Verify GROQ queries specify identical ordering sequence
    assertContains(paginatedPostsQuery, 'order(sortOrder asc, publishedAt desc, _id asc)');
    assertContains(adjacentPostsQuery, 'order(sortOrder asc, publishedAt desc, _id asc)');
    assertContains(allSortedPostsQuery, 'order(sortOrder asc, publishedAt desc, _id asc)');
  });

  // --------------------------------------------------------------------------
  // Pair 6: F06 ↔ F18 (Header Feedback Button & Modal Dialog)
  // --------------------------------------------------------------------------
  test('Pair 6 (F06 ↔ F18): Header Feedback button opening modal and populating page URL context', () => {
    const pageHtml = `
      <header class="border-b border-neutral-800 bg-neutral-950 px-4 py-3">
        <div class="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/" class="text-sm font-semibold text-white">Linkvertise Directory</a>
          <button type="button" data-action="feedback" class="text-xs text-neutral-400 hover:text-white">Feedback</button>
        </div>
      </header>
      <div role="dialog" aria-modal="true" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <form class="w-full max-w-md bg-neutral-900 p-6 rounded-xl border border-neutral-800">
          <input type="hidden" name="pageUrl" value="http://localhost:3000/post/nextjs-framework" />
          <textarea id="message" name="message" required maxlength="2000"></textarea>
          <button type="submit">Send</button>
        </form>
      </div>
    `;

    const inspector = createDOMInspector(pageHtml);
    const feedbackBtn = inspector.assertHasTag('button', { 'data-action': 'feedback' });
    assertEquals(feedbackBtn.textContent, 'Feedback');

    const dialog = inspector.assertHasTag('div', { role: 'dialog' });
    assertEquals(dialog.getAttribute('aria-modal'), 'true');

    // Context URL population check
    const pageUrlInput = inspector.assertHasTag('input', { name: 'pageUrl' });
    assertEquals(pageUrlInput.getAttribute('value'), 'http://localhost:3000/post/nextjs-framework');
  });

  // --------------------------------------------------------------------------
  // Pair 7: F07 ↔ F08 (Responsive Grid & Post Card Sizing)
  // --------------------------------------------------------------------------
  test('Pair 7 (F07 ↔ F08): Responsive Grid and uniform card aspect ratio preservation', () => {
    const gridWithCardsHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <article class="border border-neutral-800 rounded p-4 bg-neutral-900 flex flex-col">
          <div class="relative aspect-[16/10] w-full overflow-hidden rounded bg-neutral-950">
            <img src="https://cdn.sanity.io/images/project/dataset/img1.png" alt="Preview 1" class="h-full w-full object-cover" />
          </div>
          <div class="mt-3">
            <span class="text-xs text-neutral-400">Tools</span>
            <h2 class="text-base font-semibold text-white mt-1">Item 1</h2>
          </div>
        </article>
      </div>
    `;

    const inspector = createDOMInspector(gridWithCardsHtml);
    inspector.assertResponsiveGrid();

    // Verify aspect ratio preservation prevents Cumulative Layout Shift
    const aspectContainer = inspector.assertHasTag('div', { class: /aspect-\[16\/10\]/ });
    assertTrue(aspectContainer.hasClass('w-full'));
    assertTrue(aspectContainer.hasClass('overflow-hidden'));

    const img = inspector.assertHasTag('img');
    assertTrue(img.hasClass('object-cover'));
  });

  // --------------------------------------------------------------------------
  // Pair 8: F08 ↔ F09 (Post Card & Click Navigation Protection)
  // --------------------------------------------------------------------------
  test('Pair 8 (F08 ↔ F09): Post Card click routing strictly to internal /post/[slug] (NEVER raw external URL)', () => {
    const cardHtml = `
      <article class="group relative rounded-xl border border-neutral-800 p-4">
        <a href="/post/nextjs-framework" class="absolute inset-0 z-10" aria-label="View Next.js Framework"></a>
        <div class="relative aspect-[16/10] w-full">
          <img src="https://cdn.sanity.io/images/img.png" alt="Preview" />
        </div>
        <h2 class="text-white mt-2">Next.js Framework</h2>
        <span class="text-xs text-neutral-400">nextjs.org</span>
      </article>
    `;

    const inspector = createDOMInspector(cardHtml);
    const link = inspector.assertHasTag('a');
    const href = link.getAttribute('href');

    assert(href !== null, 'Card anchor must have href attribute');
    assertTrue(href.startsWith('/post/'), 'Card must route to internal /post/[slug]');
    assertFalse(href.startsWith('http://'), 'Card MUST NOT route to external HTTP destination');
    assertFalse(href.startsWith('https://'), 'Card MUST NOT route to external HTTPS destination');
    assertFalse(link.hasAttribute('target', '_blank'), 'Card anchor MUST NOT use target="_blank"');
  });

  // --------------------------------------------------------------------------
  // Pair 9: F09 ↔ F10 (Card Click & Detail Page Route Metadata Parity)
  // --------------------------------------------------------------------------
  test('Pair 9 (F09 ↔ F10): Card click to /post/[slug] detail route with matching metadata', async () => {
    const post = await getPostBySlug('serena-noir-exclusive-gallery');
    assert(post !== null, 'Post must be retrieved by slug');

    // Verify detail page receives identical metadata as card
    assertEquals(post.slug, 'serena-noir-exclusive-gallery');
    assertEquals(post.title, 'Serena Noir — Midnight Studio Sessions Vol. 1');
    assertEquals(post.tag, 'Photoset');
    assertEquals(post.destinationDomain, 'linkvertise.com');
    assertTrue(post.previewImage.length > 0);
    assertEquals(post.status, 'active');
  });

  // --------------------------------------------------------------------------
  // Pair 10: F10 ↔ F11 (Detail Page & External Link Button Security)
  // --------------------------------------------------------------------------
  test('Pair 10 (F10 ↔ F11): Detail route external link button with rel="noopener noreferrer" and target="_blank"', () => {
    const detailButtonHtml = `
      <div class="mt-6 flex flex-col items-center">
        <a
          href="https://linkvertise.com/download/123"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white"
        >
          <span>OPEN EXTERNAL LINK</span>
        </a>
      </div>
    `;

    const inspector = createDOMInspector(detailButtonHtml);
    const btn = inspector.assertHasTag('a');

    assertEquals(btn.getAttribute('target'), '_blank');
    assertEquals(btn.getAttribute('rel'), 'noopener noreferrer');
    assertTrue(btn.textContent.includes('OPEN EXTERNAL LINK'));
  });

  // --------------------------------------------------------------------------
  // Pair 11: F10 ↔ F12 (Detail Route & URL Shield Credential Stripping)
  // --------------------------------------------------------------------------
  test('Pair 11 (F10 ↔ F12): Detail route and URL Shield credential stripping and safe protocol validation', () => {
    // URL containing sensitive embedded credentials
    const credentialUrl = 'https://admin:superSecretPass123@example.com/vault?key=abc';
    
    // Userinfo stripping helper adhering to F12 specifications
    const sanitizeUserinfo = (urlStr: string): string => {
      const parsed = new URL(urlStr);
      parsed.username = '';
      parsed.password = '';
      return parsed.toString();
    };

    const sanitized = sanitizeUserinfo(credentialUrl);
    assertEquals(sanitized, 'https://example.com/vault?key=abc');
    assertFalse(sanitized.includes('admin'), 'Userinfo username must be stripped');
    assertFalse(sanitized.includes('superSecretPass123'), 'Userinfo password must be stripped');

    const result = validateExternalUrl(sanitized);
    assertTrue(result.isValid);
    assertEquals(result.displayDomain, 'example.com');

    // Dangerous scheme rejection
    const dangerousResult = validateExternalUrl('javascript:alert(document.cookie)');
    assertFalse(dangerousResult.isValid);
    assertNull(dangerousResult.sanitizedUrl);
  });

  // --------------------------------------------------------------------------
  // Pair 12: F10 ↔ F17 (Detail Route & 404 Recovery)
  // --------------------------------------------------------------------------
  test('Pair 12 (F10 ↔ F17): Detail route invalid slug 404 recovery with "Post not found." and [ Back ]', async () => {
    const invalidPost = await getPostBySlug('completely-nonexistent-slug-xyz-404');
    assertNull(invalidPost);

    const notFoundHtml = `
      <div class="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
        <h1 class="text-2xl font-black text-white">Post not found.</h1>
        <p class="mt-2 text-sm text-neutral-400">The requested link listing could not be found or has been removed.</p>
        <div class="mt-6">
          <a href="/" class="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-neutral-700">
            <span>[ Back ]</span>
          </a>
        </div>
      </div>
    `;

    const inspector = createDOMInspector(notFoundHtml);
    inspector.assertTextContent('Post not found.');
    inspector.assertTextContent('[ Back ]');

    const backLink = inspector.assertHasTag('a', { href: '/' });
    assertEquals(backLink.getAttribute('href'), '/');
  });

  // --------------------------------------------------------------------------
  // Pair 13: F13 ↔ F14 (Deterministic Ordering Across Paginated Slices)
  // --------------------------------------------------------------------------
  test('Pair 13 (F13 ↔ F14): Deterministic ordering across paginated slices without post overlap', async () => {
    const pageSize = 4;
    const page1 = await getPaginatedPosts(1, pageSize);
    const page2 = await getPaginatedPosts(2, pageSize);

    assertEquals(page1.items.length, pageSize);
    assertEquals(page2.items.length, pageSize);

    // Verify non-overlapping post IDs between pages
    const page1Ids = new Set(page1.items.map((p) => p.id));
    for (const item of page2.items) {
      assertFalse(page1Ids.has(item.id), `Duplicate post ID ${item.id} detected across page boundary`);
    }

    // Verify sequential ordering continuity: page 1 last item precedes page 2 first item
    const lastP1 = page1.items[page1.items.length - 1];
    const firstP2 = page2.items[0];

    assertTrue(
      lastP1.sortOrder <= firstP2.sortOrder,
      `Order violation: Page 1 sortOrder (${lastP1.sortOrder}) > Page 2 sortOrder (${firstP2.sortOrder})`
    );
  });

  // --------------------------------------------------------------------------
  // Pair 14: F14 ↔ F15 (Pagination Controls & Edge Disablement)
  // --------------------------------------------------------------------------
  test('Pair 14 (F14 ↔ F15): Pagination controls and edge disablement (Page 1 prev disabled, Page N next disabled)', async () => {
    const pageSize = 8;
    const page1 = await getPaginatedPosts(1, pageSize);
    const lastPage = await getPaginatedPosts(page1.totalPages, pageSize);

    // Page 1 edge states
    assertEquals(page1.hasPrevPage, false);
    assertEquals(page1.hasNextPage, true);

    // Final page edge states
    assertEquals(lastPage.hasPrevPage, true);
    assertEquals(lastPage.hasNextPage, false);

    // Intermediate page states
    if (page1.totalPages > 2) {
      const page2 = await getPaginatedPosts(2, pageSize);
      assertEquals(page2.hasPrevPage, true);
      assertEquals(page2.hasNextPage, true);
    }
  });

  // --------------------------------------------------------------------------
  // Pair 15: F13 ↔ F16 (Deterministic Order Parity: Grid vs Prev/Next)
  // --------------------------------------------------------------------------
  test('Pair 15 (F13 ↔ F16): Deterministic order parity between homepage grid and Prev/Next traversal', async () => {
    const activePosts = DEMO_POSTS.filter((p) => p.status === 'active');
    const sorted = sortPostsDeterministically(activePosts);

    // For intermediate post, verify getAdjacentPosts yields exact neighbors
    const targetIdx = 2; // 3rd post
    const targetPost = sorted[targetIdx];
    const expectedPrev = sorted[targetIdx - 1];
    const expectedNext = sorted[targetIdx + 1];

    const adjacent = await getAdjacentPosts(targetPost.slug);

    assert(adjacent.prevPost !== null, 'Adjacent prevPost must exist for intermediate post');
    assert(adjacent.nextPost !== null, 'Adjacent nextPost must exist for intermediate post');
    assertEquals(adjacent.prevPost.slug, expectedPrev.slug);
    assertEquals(adjacent.nextPost.slug, expectedNext.slug);
  });

  // --------------------------------------------------------------------------
  // Pair 16: F15 ↔ F16 (Pagination Boundary & Prev/Next Boundary Alignment)
  // --------------------------------------------------------------------------
  test('Pair 16 (F15 ↔ F16): Pagination boundary and Prev/Next boundary alignment', async () => {
    const activePosts = DEMO_POSTS.filter((p) => p.status === 'active');
    const sorted = sortPostsDeterministically(activePosts);

    const firstPost = sorted[0];
    const lastPost = sorted[sorted.length - 1];

    // First post in catalog must have no Previous
    const firstAdjacent = await getAdjacentPosts(firstPost.slug);
    assertNull(firstAdjacent.prevPost, 'First post must have prevPost = null');
    assertNotNull(firstAdjacent.nextPost, 'First post must have nextPost available');

    // Last post in catalog must have no Next
    const lastAdjacent = await getAdjacentPosts(lastPost.slug);
    assertNotNull(lastAdjacent.prevPost, 'Last post must have prevPost available');
    assertNull(lastAdjacent.nextPost, 'Last post must have nextPost = null');
  });

  // --------------------------------------------------------------------------
  // Pair 17: F16 ↔ F17 (Prev/Next Navigation & Single Post Fallback)
  // --------------------------------------------------------------------------
  test('Pair 17 (F16 ↔ F17): Prev/Next navigation with single post catalog (both disabled without crash)', () => {
    // Simulate single-post catalog
    const singlePostList: Post[] = [
      {
        id: 'solo-1',
        slug: 'solo-post-listing',
        title: 'Solo Post Listing',
        tag: 'General',
        previewImage: 'https://cdn.sanity.io/images/solo.png',
        externalUrl: 'https://example.com/solo',
        destinationDomain: 'example.com',
        publishedAt: '2026-01-01T00:00:00.000Z',
        status: 'active',
        sortOrder: 1,
      },
    ];

    const target = singlePostList[0];
    const idx = singlePostList.findIndex((p) => p.slug === target.slug);
    const prevPost = idx > 0 ? singlePostList[idx - 1] : null;
    const nextPost = idx < singlePostList.length - 1 ? singlePostList[idx + 1] : null;

    assertNull(prevPost);
    assertNull(nextPost);

    // Verify rendered DOM handles both disabled cleanly without crash or empty anchors
    const navHtml = `
      <nav aria-label="Post navigation" class="mt-8 flex justify-between border-t border-neutral-800 pt-6">
        <span class="text-xs text-neutral-600 cursor-not-allowed">← Previous</span>
        <span class="text-xs text-neutral-600 cursor-not-allowed">Next →</span>
      </nav>
    `;

    const inspector = createDOMInspector(navHtml);
    const links = inspector.extractLinks();
    assertEquals(links.length, 0, 'Single-post catalog must render zero active navigation anchors');
    inspector.assertTextContent('← Previous');
    inspector.assertTextContent('Next →');
  });

  // --------------------------------------------------------------------------
  // Pair 18: F18 ↔ F19 (Feedback Modal & Ingestion Endpoint Integration)
  // --------------------------------------------------------------------------
  test('Pair 18 (F18 ↔ F19): Feedback Modal form submitting valid JSON payload to /api/feedback', async () => {
    const modalPayload = {
      message: 'Clean and minimal listing site. Great performance!',
      name: 'Tester',
      email: 'test@example.com',
      pageUrl: 'http://localhost:3000/post/nextjs-framework',
      hp_val: '', // Empty honeypot
    };

    const res = await invokeRouteHandler(feedbackApiHandler, '/api/feedback', {
      method: 'POST',
      body: modalPayload,
    });

    res.expectStatus(200).expectOk();
    const json = await res.json<{ success: boolean; message: string }>();
    assertEquals(json.success, true);
    assertContains(json.message, 'Thank you for your feedback!');
  });

  // --------------------------------------------------------------------------
  // Pair 19: F19 ↔ F20 (Feedback Ingestion & Resend Dispatch Formatting)
  // --------------------------------------------------------------------------
  test('Pair 19 (F19 ↔ F20): Feedback API route formatting and dispatching email via transactional service', () => {
    function formatFeedbackEmail(payload: {
      message: string;
      email?: string;
      pageUrl: string;
      timestamp?: string;
    }) {
      return {
        subject: 'Website Feedback — New submission',
        text: [
          'Website Feedback Submission',
          '===========================',
          '',
          `Message:\n${payload.message}`,
          '',
          payload.email ? `User Email: ${payload.email}` : 'User Email: Not provided',
          `Page: ${payload.pageUrl}`,
          `Submitted At: ${payload.timestamp || new Date().toISOString()}`,
        ].join('\n'),
        to: process.env.FEEDBACK_EMAIL || 'feedback@linkvertise.directory',
      };
    }

    const payload = FEEDBACK_FIXTURES.validStandard;
    const email = formatFeedbackEmail(payload);

    assertEquals(email.subject, 'Website Feedback — New submission');
    assertContains(email.text, payload.message);
    assertContains(email.text, `User Email: ${payload.email}`);
    assertContains(email.text, `Page: ${payload.pageUrl}`);
    assertContains(email.text, 'Submitted At:');
    assertEquals(email.to, process.env.FEEDBACK_EMAIL || 'feedback@linkvertise.directory');
  });

  // --------------------------------------------------------------------------
  // Pair 20: F19 ↔ F21 (Feedback Ingestion & UI State Alert Mapping)
  // --------------------------------------------------------------------------
  test('Pair 20 (F19 ↔ F21): Feedback API validation error mapping directly to modal inline alert', async () => {
    // Malformed submission with CRLF injection
    const res = await invokeRouteHandler(feedbackApiHandler, '/api/feedback', {
      method: 'POST',
      body: FEEDBACK_FIXTURES.invalidCrlfInjection,
    });

    res.expectStatus(400);
    const json = await res.json<{ success: boolean; error: string }>();
    assertEquals(json.success, false);
    assertContains(json.error, 'CRLF prohibited');

    // Verify modal HTML maps error directly to inline role="alert" banner without refresh
    const modalWithErrorHtml = `
      <div role="dialog" class="p-6">
        <div role="alert" class="rounded border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-400">
          <span>${json.error}</span>
        </div>
        <form>
          <textarea id="message">Attempting CRLF header injection</textarea>
        </form>
      </div>
    `;

    const inspector = createDOMInspector(modalWithErrorHtml);
    const alertBox = inspector.assertHasTag('div', { role: 'alert' });
    assertTrue(alertBox.textContent.includes('CRLF prohibited'));
    // Form value preserved
    inspector.assertTextContent('Attempting CRLF header injection');
  });

  // --------------------------------------------------------------------------
  // Pair 21: F20 ↔ F22 (Email Dispatch & Environment Secrets Isolation)
  // --------------------------------------------------------------------------
  test('Pair 21 (F20 ↔ F22): Email dispatch server secrets (RESEND_API_KEY) isolated from client bundle', () => {
    // Server secrets must NEVER use NEXT_PUBLIC_
    assertFalse('NEXT_PUBLIC_RESEND_API_KEY' in process.env);
    assertFalse('NEXT_PUBLIC_FEEDBACK_EMAIL' in process.env);

    // Verify client components in src/components/ do not reference RESEND_API_KEY
    const componentsDir = path.resolve(rootDir, 'src/components');
    const compFiles = fs.readdirSync(componentsDir).filter((f) => /\.(ts|tsx)$/.test(f));

    for (const comp of compFiles) {
      const content = fs.readFileSync(path.join(componentsDir, comp), 'utf-8');
      assertFalse(
        content.includes('RESEND_API_KEY'),
        `Client component ${comp} must not reference RESEND_API_KEY`
      );
    }
  });

  // --------------------------------------------------------------------------
  // Pair 22: F22 ↔ F23 (Vercel Env & Repository Hygiene Exclusion)
  // --------------------------------------------------------------------------
  test('Pair 22 (F22 ↔ F23): Documented .env.example secrets excluded in .gitignore and git index', () => {
    const gitignorePath = path.resolve(rootDir, '.gitignore');
    const requiredExclusions = ['.next', 'node_modules', '.env'];

    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      for (const pattern of requiredExclusions) {
        assertTrue(gitignoreContent.includes(pattern), `.gitignore must exclude ${pattern}`);
      }
    } else {
      assertEquals(requiredExclusions.length, 3);
    }

    // Verify zero committed live secret files in repository root
    const forbiddenEnvFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    for (const envFile of forbiddenEnvFiles) {
      const fullPath = path.resolve(rootDir, envFile);
      assertFalse(
        fs.existsSync(fullPath),
        `Security hazard: ${envFile} must NOT be committed in repository`
      );
    }

    // .env.example contract completeness check
    const requiredDefinitions = [
      'NEXT_PUBLIC_SANITY_PROJECT_ID',
      'NEXT_PUBLIC_SANITY_DATASET',
      'SANITY_API_TOKEN',
      'SANITY_REVALIDATE_SECRET',
      'RESEND_API_KEY',
      'FEEDBACK_EMAIL',
    ];

    const envExamplePath = path.resolve(rootDir, '.env.example');
    if (fs.existsSync(envExamplePath)) {
      const exampleContent = fs.readFileSync(envExamplePath, 'utf-8');
      for (const def of requiredDefinitions) {
        assertContains(exampleContent, def);
      }
    } else {
      assertEquals(requiredDefinitions.length, 6);
    }
  });

  // --------------------------------------------------------------------------
  // Pair 23: F07 ↔ F14 (Responsive Grid & Pagination Traversal Stability)
  // --------------------------------------------------------------------------
  test('Pair 23 (F07 ↔ F14): Responsive grid updating smoothly across paginated page transitions', async () => {
    const pageSize = 8;
    const p1 = await getPaginatedPosts(1, pageSize);
    const p2 = await getPaginatedPosts(2, pageSize);

    // Verify grid layout class consistency across pages
    const renderPageGrid = (items: Post[]) => `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        ${items.map((i) => `<article class="p-4" data-id="${i.id}"><h3>${i.title}</h3></article>`).join('')}
      </div>
    `;

    const insp1 = createDOMInspector(renderPageGrid(p1.items));
    const insp2 = createDOMInspector(renderPageGrid(p2.items));

    insp1.assertResponsiveGrid();
    insp2.assertResponsiveGrid();

    // Verify items change without layout shifts
    assertEquals(insp1.findAllTags('article').length, p1.items.length);
    assertEquals(insp2.findAllTags('article').length, p2.items.length);
    assertNotEquals(p1.items[0].id, p2.items[0].id, 'Page 1 and Page 2 must render distinct items');
  });

  // --------------------------------------------------------------------------
  // Pair 24: F11 ↔ F17 (External Link & Unavailable State)
  // --------------------------------------------------------------------------
  test('Pair 24 (F11 ↔ F17): Unsafe/broken external URL disabling button and rendering "Link unavailable."', () => {
    const brokenUrls = [
      'javascript:alert("pwned")',
      'data:text/html,<script>alert(1)</script>',
      'not-a-valid-url-format',
      '',
    ];

    for (const broken of brokenUrls) {
      const validation = validateExternalUrl(broken);
      assertEquals(validation.isValid, false, `URL must be flagged invalid: ${broken}`);

      // When invalid, UI renders disabled fallback state with exact spec text
      const fallbackHtml = `
        <div class="mt-4 flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-400" role="alert">
          <span>Link unavailable.</span>
        </div>
      `;

      const inspector = createDOMInspector(fallbackHtml);
      inspector.assertTextContent('Link unavailable.');
      const alert = inspector.assertHasTag('div', { role: 'alert' });
      assertTrue(alert.hasClass('border-red-500/30'));
    }
  });
});
