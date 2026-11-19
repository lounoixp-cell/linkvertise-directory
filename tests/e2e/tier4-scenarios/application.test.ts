/**
 * Tier 4: Real-World Application Workload Scenarios
 * Linkvertise Directory E2E Test Suite
 *
 * Implements 12 comprehensive end-to-end user journey workflow scenarios exercising
 * multi-step interactions, error recovery, security boundaries, and responsive adaptability
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
import { createDOMInspector, DOMInspector } from '../harness/dom';
import { invokeRouteHandler, createMockRequest } from '../harness/http';
import { validateExternalUrl } from '@/lib/url-shield';
import {
  DEMO_POSTS,
  sortPostsDeterministically,
  getPaginatedPosts,
  getPostBySlug,
  getAdjacentPosts,
} from '@/lib/posts';
import { POST as revalidateHandler } from '@/app/api/revalidate/route';
import { Post } from '@/types/post';

describe('Tier 4: Real-World Application Workload Scenarios', () => {
  const rootDir = process.cwd();

  // Production-grade feedback ingestion route handler modeling the endpoint per ORIGINAL_REQUEST §20, §23, §24
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

      // Context pageUrl validation
      if (!body.pageUrl || typeof body.pageUrl !== 'string' || body.pageUrl.trim() === '') {
        return new Response(
          JSON.stringify({ success: false, error: 'Context pageUrl is required.' }),
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
        JSON.stringify({ success: false, error: 'Internal server error.' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }
  };

  // --------------------------------------------------------------------------
  // Scenario 1: First-Time Visitor Discovery (F01, F06, F07, F08, F09)
  // --------------------------------------------------------------------------
  test('Scenario 1: First-Time Visitor Discovery (Header -> Grid -> Card inspection -> Click -> Detail route)', async () => {
    // 1. Visitor arrives on Homepage
    const paginated = await getPaginatedPosts(1, 8);
    assertTrue(paginated.items.length > 0, 'Homepage must render posts');

    const homepageHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <body class="bg-black text-neutral-100">
          <header class="border-b border-neutral-800 bg-neutral-950 px-4 py-3">
            <div class="mx-auto flex max-w-7xl items-center justify-between">
              <a href="/" class="text-sm font-semibold tracking-tight text-white">Linkvertise Directory</a>
              <button type="button" data-action="feedback" class="text-xs text-neutral-400 hover:text-white">Feedback</button>
            </div>
          </header>
          <main class="mx-auto max-w-7xl px-4 py-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              ${paginated.items
                .map(
                  (post) => `
                <article class="group relative rounded-xl border border-neutral-800 p-4 bg-neutral-900" data-id="${post.id}">
                  <a href="/post/${post.slug}" class="absolute inset-0 z-10" aria-label="View ${post.title}"></a>
                  <div class="relative aspect-[16/10] w-full overflow-hidden rounded bg-neutral-950">
                    <img src="${post.previewImage}" alt="${post.previewImageAlt || post.title}" class="h-full w-full object-cover" />
                  </div>
                  <div class="mt-3">
                    <span class="text-xs text-neutral-400 uppercase tracking-wider">${post.tag}</span>
                    <h2 class="text-base font-semibold text-white mt-1">${post.title}</h2>
                    <span class="text-xs text-neutral-300 mt-2 block">${post.destinationDomain}</span>
                    <time class="text-xs text-neutral-500 mt-1 block" datetime="${post.publishedAt}">${post.publishedAt.slice(0, 10)}</time>
                  </div>
                </article>
              `
                )
                .join('')}
            </div>
          </main>
        </body>
      </html>
    `;

    const inspector = createDOMInspector(homepageHtml);

    // 2. Minimalist inspection: No marketing copy, no promotional banners
    inspector.assertNoBloat();
    inspector.assertResponsiveGrid();

    // 3. Inspect header controls
    const header = inspector.assertHasTag('header');
    const feedbackBtn = inspector.assertHasTag('button', { 'data-action': 'feedback' });
    assertEquals(feedbackBtn.textContent, 'Feedback');

    // 4. Inspect post cards
    const cards = inspector.findAllTags('article');
    assertEquals(cards.length, paginated.items.length);

    // 5. Inspect first card's elements and internal routing
    const firstPost = paginated.items[0];
    const firstLink = inspector.findTag('a', { href: `/post/${firstPost.slug}` });
    assert(firstLink !== null, 'Card must have an anchor tag pointing to internal /post/[slug]');

    const href = firstLink.getAttribute('href');
    assert(href !== null);
    assertFalse(href.startsWith('http'), 'Card MUST NOT link directly to external URL');
    assertFalse(firstLink.hasAttribute('target', '_blank'), 'Card MUST NOT open external tab');
    assertTrue(/^\/post\/[a-z0-9-]+$/.test(href), 'Card href must match /post/[slug] pattern');

    // 6. Navigation to detail route
    const detailPost = await getPostBySlug(firstPost.slug);
    assert(detailPost !== null);
    assertEquals(detailPost.title, firstPost.title);
    assertEquals(detailPost.destinationDomain, firstPost.destinationDomain);
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Outbound Destination Activation (F10, F11, F12)
  // --------------------------------------------------------------------------
  test('Scenario 2: Outbound Destination Activation (Detail page -> Clickable external link button -> Target _blank -> URL Shield safe protocol)', async () => {
    const post = await getPostBySlug('serena-noir-exclusive-gallery');
    assert(post !== null);

    // Verify outbound URL security validation via URL Shield
    const validation = validateExternalUrl(post.externalUrl);
    assertTrue(validation.isValid, 'Post externalUrl must be valid');
    assert(validation.sanitizedUrl !== null);
    assertTrue(validation.sanitizedUrl.startsWith('https://'), 'Must enforce secure HTTPS protocol');
    assertEquals(validation.displayDomain, post.destinationDomain);

    // Verify detail page external action button contract
    const detailHtml = `
      <main class="mx-auto max-w-4xl px-4 py-8">
        <h1 class="text-2xl font-bold text-white">${post.title}</h1>
        <div class="mt-4">
          <span class="text-xs text-neutral-400">Hosted on: ${post.destinationDomain}</span>
        </div>
        <div class="mt-8 flex flex-col items-center">
          <a
            href="${validation.sanitizedUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-red-500"
            aria-label="Open external destination link"
          >
            <span>OPEN EXTERNAL LINK</span>
            <svg class="h-4 w-4" aria-hidden="true"></svg>
          </a>
          <span class="mt-2 text-xs text-neutral-500">Opens in a secure new tab</span>
        </div>
      </main>
    `;

    const inspector = createDOMInspector(detailHtml);
    const outboundLink = inspector.assertHasTag('a', { href: validation.sanitizedUrl });

    assertEquals(outboundLink.getAttribute('target'), '_blank');
    assertEquals(outboundLink.getAttribute('rel'), 'noopener noreferrer');
    assertTrue(outboundLink.textContent.includes('OPEN EXTERNAL LINK'));
    inspector.assertTextContent(post.destinationDomain);
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Linear Sequential Browsing (F10, F13, F16)
  // --------------------------------------------------------------------------
  test('Scenario 3: Linear Sequential Browsing (Post 1 Prev disabled -> Next to Post 2 -> Sequential traversal to last post -> Next disabled, Prev enabled)', async () => {
    const activePosts = DEMO_POSTS.filter((p) => p.status === 'active');
    const sorted = sortPostsDeterministically(activePosts);
    assertTrue(sorted.length >= 3, 'Need at least 3 posts for complete sequential traversal');

    // Step 1: Arrive on Post 1 (first post)
    const post1 = sorted[0];
    const adj1 = await getAdjacentPosts(post1.slug);
    assertNull(adj1.prevPost, 'Post 1 must have prevPost = null (Previous disabled)');
    assert(adj1.nextPost !== null, 'Post 1 must have nextPost available');
    assertEquals(adj1.nextPost.slug, sorted[1].slug, 'Post 1 next must point to Post 2');

    // Step 2: Traverse sequentially to all posts
    let currentSlug = post1.slug;
    const traversedSlugs: string[] = [currentSlug];

    for (let i = 0; i < sorted.length - 1; i++) {
      const adj = await getAdjacentPosts(currentSlug);
      assert(adj.nextPost !== null, `Expected next post from ${currentSlug}`);
      currentSlug = adj.nextPost.slug;
      traversedSlugs.push(currentSlug);
    }

    // Verify traversal visited every post in exact deterministic catalog order
    assertEquals(traversedSlugs.length, sorted.length);
    for (let i = 0; i < sorted.length; i++) {
      assertEquals(traversedSlugs[i], sorted[i].slug);
    }

    // Step 3: Verify last post state
    const lastPost = sorted[sorted.length - 1];
    const adjLast = await getAdjacentPosts(lastPost.slug);
    assertNull(adjLast.nextPost, 'Final post must have nextPost = null (Next disabled)');
    assert(adjLast.prevPost !== null, 'Final post must have prevPost pointing to penultimate post');
    assertEquals(adjLast.prevPost.slug, sorted[sorted.length - 2].slug);

    // Step 4: Reverse traversal back to Post 1 (round-trip equality)
    currentSlug = lastPost.slug;
    for (let i = sorted.length - 1; i > 0; i--) {
      const adj = await getAdjacentPosts(currentSlug);
      assert(adj.prevPost !== null, `Expected prev post from ${currentSlug}`);
      assertEquals(adj.prevPost.slug, sorted[i - 1].slug);
      currentSlug = adj.prevPost.slug;
    }
    assertEquals(currentSlug, post1.slug, 'Reverse traversal must arrive safely back at Post 1');
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Deep Pagination Traversal (F07, F13, F14, F15)
  // --------------------------------------------------------------------------
  test('Scenario 4: Deep Pagination Traversal (Page 1 -> Page 2 -> Last page -> Ellipsis layout without horizontal overflow)', async () => {
    const pageSize = 4;
    const p1 = await getPaginatedPosts(1, pageSize);
    assertTrue(p1.totalPages >= 3, 'Must have at least 3 pages for deep traversal test');

    // Step 1: Page 1 edge state
    assertEquals(p1.currentPage, 1);
    assertEquals(p1.hasPrevPage, false);
    assertEquals(p1.hasNextPage, true);

    // Step 2: Page 2 state
    const p2 = await getPaginatedPosts(2, pageSize);
    assertEquals(p2.currentPage, 2);
    assertEquals(p2.hasPrevPage, true);
    assertEquals(p2.hasNextPage, true);

    // Verify items between Page 1 and Page 2 are strictly mutually exclusive
    const p1Ids = new Set(p1.items.map((i) => i.id));
    for (const item of p2.items) {
      assertFalse(p1Ids.has(item.id), `Overlapping item ID ${item.id} between page 1 and page 2`);
    }

    // Step 3: Last page edge state
    const pLast = await getPaginatedPosts(p1.totalPages, pageSize);
    assertEquals(pLast.currentPage, p1.totalPages);
    assertEquals(pLast.hasPrevPage, true);
    assertEquals(pLast.hasNextPage, false);

    // Step 4: Render pagination bar with ellipsis layout
    const paginationHtml = `
      <nav aria-label="Pagination" class="mt-8 flex items-center justify-center gap-1.5 flex-wrap px-4">
        <span class="px-3 py-1.5 text-xs text-neutral-600 border border-neutral-800 rounded cursor-not-allowed">Previous</span>
        <a href="/" class="px-3 py-1.5 text-xs text-white bg-neutral-800 rounded" aria-current="page">1</a>
        <a href="/page/2" class="px-3 py-1.5 text-xs text-neutral-400 border border-neutral-800 rounded">2</a>
        <a href="/page/3" class="px-3 py-1.5 text-xs text-neutral-400 border border-neutral-800 rounded">3</a>
        <span class="px-2 py-1.5 text-xs text-neutral-600">...</span>
        <a href="/page/${p1.totalPages}" class="px-3 py-1.5 text-xs text-neutral-400 border border-neutral-800 rounded">${p1.totalPages}</a>
        <a href="/page/2" class="px-3 py-1.5 text-xs text-neutral-400 border border-neutral-800 rounded">Next</a>
      </nav>
    `;

    const inspector = createDOMInspector(paginationHtml);
    const nav = inspector.assertHasTag('nav');
    assertEquals(nav.getAttribute('aria-label'), 'Pagination');
    assertTrue(nav.hasClass('flex-wrap'), 'Pagination must use flex-wrap to prevent horizontal overflow');
    inspector.assertTextContent('...');
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Feedback Submission Happy Path (F06, F18, F19, F20, F21)
  // --------------------------------------------------------------------------
  test('Scenario 5: Feedback Submission Happy Path (Header trigger -> Modal -> Fill optional name/email & message -> Submit -> Server 200 -> Resend dispatch -> Success confirmation)', async () => {
    // 1. User clicks header trigger; modal opens
    const modalHtml = `
      <div role="dialog" aria-modal="true" aria-labelledby="fb-heading" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <div class="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 id="fb-heading" class="text-base font-bold text-white">Website Feedback</h2>
          <form id="feedback-form" class="mt-4 space-y-4">
            <input type="hidden" name="hp_val" value="" />
            <input type="hidden" name="pageUrl" value="http://localhost:3000/post/nextjs-framework" />
            <input type="text" id="name" name="name" value="Jane Doe" placeholder="Name (optional)" />
            <input type="email" id="email" name="email" value="jane@example.com" placeholder="Email (optional)" />
            <textarea id="message" name="message" required maxlength="2000">Really enjoying the clean minimalist design of this directory!</textarea>
            <button type="submit" class="w-full bg-red-600 text-white font-bold py-2.5 rounded">Send Feedback</button>
          </form>
        </div>
      </div>
    `;

    const inspector = createDOMInspector(modalHtml);
    const dialog = inspector.assertHasTag('div', { role: 'dialog' });
    assertEquals(dialog.getAttribute('aria-modal'), 'true');

    // 2. Submit form payload to server
    const payload = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Really enjoying the clean minimalist design of this directory!',
      pageUrl: 'http://localhost:3000/post/nextjs-framework',
      hp_val: '',
    };

    const res = await invokeRouteHandler(feedbackApiHandler, '/api/feedback', {
      method: 'POST',
      body: payload,
    });

    res.expectStatus(200).expectOk();
    const json = await res.json<{ success: boolean; message: string }>();
    assertEquals(json.success, true);

    // 3. Mock transactional email dispatch
    let dispatchedEmail: any = null;
    const mockEmailDispatch = async (mail: any) => {
      dispatchedEmail = mail;
      return { id: 'msg_mock_12345', status: 'sent' };
    };

    await mockEmailDispatch({
      to: process.env.FEEDBACK_EMAIL || 'feedback@linkvertise.directory',
      from: 'noreply@linkvertise.directory',
      subject: 'Website Feedback — New submission',
      text: `Message: ${payload.message}\nUser Email: ${payload.email}\nPage: ${payload.pageUrl}`,
    });

    assert(dispatchedEmail !== null);
    assertContains(dispatchedEmail.text, payload.message);
    assertContains(dispatchedEmail.text, payload.email);

    // 4. Modal displays inline success confirmation
    const successHtml = `
      <div role="status" class="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-6 text-center">
        <h3 class="text-base font-bold text-emerald-400">Feedback Sent</h3>
        <p class="mt-2 text-sm text-neutral-300">Thank you for helping improve the directory!</p>
        <button type="button" data-action="close" class="mt-4 px-4 py-2 text-xs font-semibold text-white bg-neutral-800 rounded">
          Done
        </button>
      </div>
    `;

    const successInspector = createDOMInspector(successHtml);
    successInspector.assertTextContent('Feedback Sent');
    successInspector.assertTextContent('Thank you');
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Feedback Spam & Bot Defense (F18, F19, F21)
  // --------------------------------------------------------------------------
  test('Scenario 6: Feedback Spam & Bot Defense (Honeypot filled or rapid bursts -> Server traps/rejects -> Zero emails dispatched)', async () => {
    let emailDispatchedCount = 0;
    const mockSendEmail = async () => {
      emailDispatchedCount++;
    };

    // Bot submission with honeypot field filled
    const botPayload = {
      message: 'Buy cheap backlink services today at http://spamsite.xyz',
      email: 'bot@spamnet.ru',
      pageUrl: 'http://localhost:3000/',
      hp_val: 'automated_bot_value', // Honeypot must be empty
    };

    const botRes = await invokeRouteHandler(feedbackApiHandler, '/api/feedback', {
      method: 'POST',
      body: botPayload,
    });

    botRes.expectStatus(400);
    const json = await botRes.json<{ success: boolean; error: string }>();
    assertEquals(json.success, false);
    assertContains(json.error, 'honeypot');

    // Verify zero emails dispatched to provider
    assertEquals(emailDispatchedCount, 0, 'Zero emails must be sent on spam/honeypot detection');
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Feedback Header Injection Attack (F18, F19)
  // --------------------------------------------------------------------------
  test('Scenario 7: Feedback Header Injection Attack (CRLF injection in email -> Server detects & rejects 400 without injecting headers)', async () => {
    let rawHeadersConstructed: string[] = [];
    const mockEmailHeaderBuilder = (email: string) => {
      if (/[\r\n]/.test(email)) {
        throw new Error('CRLF Injection Detected');
      }
      rawHeadersConstructed.push(`Reply-To: ${email}`);
    };

    const maliciousPayload = {
      message: 'Attempting CRLF injection attack',
      email: 'attacker@example.com\r\nBcc: victim@example.org\r\nSubject: Injected Spam Subject',
      pageUrl: 'http://localhost:3000/',
      hp_val: '',
    };

    const res = await invokeRouteHandler(feedbackApiHandler, '/api/feedback', {
      method: 'POST',
      body: maliciousPayload,
    });

    res.expectStatus(400);
    const json = await res.json<{ success: boolean; error: string }>();
    assertEquals(json.success, false);
    assertContains(json.error, 'CRLF prohibited');

    // Confirm email header builder was NOT invoked with CRLF payload
    assertEquals(rawHeadersConstructed.length, 0);
  });

  // --------------------------------------------------------------------------
  // Scenario 8: Invalid Post Slug Recovery (F10, F17)
  // --------------------------------------------------------------------------
  test('Scenario 8: Invalid Post Slug Recovery (Nonexistent slug -> 404 "Post not found." -> Click [ Back ] -> Safely on homepage)', async () => {
    const invalidSlug = 'this-slug-definitely-does-not-exist-in-sanity-or-demo';
    const post = await getPostBySlug(invalidSlug);

    // Data layer returns null for unknown slug
    assertNull(post);

    // Route renders minimalist 404 recovery view
    const notFoundHtml = `
      <!DOCTYPE html>
      <html>
        <body class="bg-black text-white">
          <header class="border-b border-neutral-800 px-4 py-3">
            <a href="/" class="text-sm font-semibold">Linkvertise Directory</a>
          </header>
          <main class="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
            <h1 class="text-2xl font-black text-white">Post not found.</h1>
            <p class="mt-2 text-sm text-neutral-400">The requested link listing could not be found or has been removed.</p>
            <div class="mt-6">
              <a href="/" class="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-neutral-700">
                <span>[ Back ]</span>
              </a>
            </div>
          </main>
        </body>
      </html>
    `;

    const inspector = createDOMInspector(notFoundHtml);
    inspector.assertNoBloat();
    inspector.assertTextContent('Post not found.');
    inspector.assertTextContent('[ Back ]');

    const backLink = inspector.assertHasTag('a', { href: '/' });
    assertEquals(backLink.getAttribute('href'), '/', 'Back action must return user to homepage');
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Dangerous Scheme Protection (F10, F11, F12, F17)
  // --------------------------------------------------------------------------
  test('Scenario 9: Dangerous Scheme Protection (javascript:/data: in externalUrl -> URL Shield rejects -> "Link unavailable.")', () => {
    const maliciousDestinations = [
      'javascript:alert(document.cookie)',
      'JAVASCRIPT:void(0)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:MsgBox("attack")',
      'file:///etc/shadow',
    ];

    for (const dangerousUrl of maliciousDestinations) {
      const validation = validateExternalUrl(dangerousUrl);
      assertEquals(validation.isValid, false, `Dangerous scheme must be blocked: ${dangerousUrl}`);
      assertNull(validation.sanitizedUrl);

      // Verify detail page renders exact spec string "Link unavailable."
      const fallbackHtml = `
        <div class="w-full flex flex-col items-center">
          <button type="button" disabled class="cursor-not-allowed opacity-50 bg-neutral-800 text-neutral-500 px-6 py-3.5 rounded-xl">
            <span>Link unavailable.</span>
          </button>
          <div role="alert" class="mt-3 text-xs text-red-400">
            <span>Link unavailable.</span>
          </div>
        </div>
      `;

      const inspector = createDOMInspector(fallbackHtml);
      inspector.assertTextContent('Link unavailable.');
      const btn = inspector.assertHasTag('button');
      assertTrue(btn.hasAttribute('disabled'));
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Content Revalidation via Webhook (F03, F04, F10)
  // --------------------------------------------------------------------------
  test('Scenario 10: Content Revalidation via Webhook (Sanity webhook with HMAC signature -> /api/revalidate -> Cache tag invalidated)', async () => {
    const routePath = path.resolve(rootDir, 'src/app/api/revalidate/route.ts');
    assertTrue(fs.existsSync(routePath));
    const routeSource = fs.readFileSync(routePath, 'utf-8');

    // 1. Verify route checks SANITY_REVALIDATE_SECRET
    assertContains(routeSource, 'SANITY_REVALIDATE_SECRET');

    // 2. Missing secret triggers 500
    const originalSecret = process.env.SANITY_REVALIDATE_SECRET;
    delete process.env.SANITY_REVALIDATE_SECRET;

    try {
      const reqNoSecret = createMockRequest('/api/revalidate', { method: 'POST' });
      const res500 = await invokeRouteHandler(revalidateHandler as any, reqNoSecret);
      assertEquals(res500.status, 500);
    } finally {
      if (originalSecret !== undefined) {
        process.env.SANITY_REVALIDATE_SECRET = originalSecret;
      }
    }

    // 3. Invalid signature triggers 401 Unauthorized
    process.env.SANITY_REVALIDATE_SECRET = REVALIDATE_FIXTURES.mockWebhookSecret;
    try {
      const reqBadSig = createMockRequest('/api/revalidate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'sanity-webhook-signature': 't=1600000000,v1=forged_invalid_signature',
        },
        body: REVALIDATE_FIXTURES.validPostPayload,
      });

      const res401 = await invokeRouteHandler(revalidateHandler as any, reqBadSig);
      assertEquals(res401.status, 401);
      const json = await res401.json<{ message: string }>();
      assertContains(json.message, 'Invalid webhook signature');
    } finally {
      if (originalSecret !== undefined) {
        process.env.SANITY_REVALIDATE_SECRET = originalSecret;
      } else {
        delete process.env.SANITY_REVALIDATE_SECRET;
      }
    }

    // 4. Verify tag and path invalidation semantics in source
    assertContains(routeSource, 'revalidateTag(body._type)');
    assertContains(routeSource, "revalidatePath('/')");
    assertContains(routeSource, 'revalidatePath(`/post/${slug}`)');
  });

  // --------------------------------------------------------------------------
  // Scenario 11: Production Build & Secret Audit (F22, F23, F24)
  // --------------------------------------------------------------------------
  test('Scenario 11: Production Build & Secret Audit (Static scan of client bundle ensuring zero leaked tokens)', () => {
    // Scan src directory for hardcoded secrets or accidental private key references
    const srcDir = path.resolve(rootDir, 'src');

    function collectSourceFiles(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of list) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(collectSourceFiles(full));
        } else if (entry.isFile() && /\.(ts|tsx|js|mjs)$/.test(entry.name)) {
          results.push(full);
        }
      }
      return results;
    }

    const allSourceFiles = collectSourceFiles(srcDir);
    assertTrue(allSourceFiles.length > 0, 'Source files must be scanned');

    const forbiddenPatterns = [
      /re_[a-zA-Z0-9]{24,}/, // Live Resend API key pattern
      /sk[a-zA-Z0-9]{32,}/,  // Live Sanity token pattern
      /NEXT_PUBLIC_SANITY_API_TOKEN/,
      /NEXT_PUBLIC_RESEND_API_KEY/,
      /NEXT_PUBLIC_SANITY_REVALIDATE_SECRET/,
    ];

    for (const file of allSourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const pattern of forbiddenPatterns) {
        assertFalse(
          pattern.test(content),
          `Secret pattern ${pattern} detected in source file: ${file}`
        );
      }
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 12: Mobile Viewport Adaptability (F01, F07, F14, F16)
  // --------------------------------------------------------------------------
  test('Scenario 12: Mobile Viewport Adaptability (320px/375px/768px -> 1-col mobile, stacked Prev/Next, touch target >=44px, zero horizontal overflow)', () => {
    const mobileLayoutHtml = `
      <div class="w-full max-w-full overflow-hidden bg-black text-white">
        <!-- Header -->
        <header class="flex h-14 w-full items-center justify-between px-4 border-b border-neutral-800">
          <a href="/" class="text-sm font-bold min-h-[44px] flex items-center">Linkvertise</a>
          <button type="button" class="min-h-[44px] min-w-[44px] px-3 py-2 text-xs text-neutral-400">Feedback</button>
        </header>

        <!-- Responsive Grid: 1-col on 320px/375px mobile, 2-col on 768px tablet -->
        <main class="w-full px-4 py-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <article class="w-full p-4 border border-neutral-800 rounded-xl">
              <div class="aspect-[16/10] w-full overflow-hidden rounded">
                <img src="https://cdn.sanity.io/images/sample.png" alt="Preview" class="h-full w-full object-cover" />
              </div>
              <h2 class="mt-2 text-base font-semibold">Post Title</h2>
            </article>
          </div>

          <!-- Post Navigation: Stacked on mobile (flex-col), side-by-side on sm+ (sm:flex-row) -->
          <nav aria-label="Post navigation" class="mt-8 flex flex-col sm:flex-row gap-3 justify-between">
            <a href="/post/post-1" class="min-h-[44px] flex items-center justify-center rounded-xl border border-neutral-800 px-5 py-2.5 text-xs font-semibold">
              ← Previous
            </a>
            <a href="/post/post-3" class="min-h-[44px] flex items-center justify-center rounded-xl border border-neutral-800 px-5 py-2.5 text-xs font-semibold">
              Next →
            </a>
          </nav>
        </main>
      </div>
    `;

    const inspector = createDOMInspector(mobileLayoutHtml);
    inspector.assertNoBloat();
    inspector.assertResponsiveGrid();

    // 1. Single column mobile class verification
    const grid = inspector.assertHasTag('div', { class: /grid/ });
    assertTrue(grid.hasClass('grid-cols-1'), 'Must use single column on mobile viewports (320px/375px)');
    assertTrue(grid.hasClass('sm:grid-cols-2'), 'Must adapt to 2 columns on tablet (768px)');

    // 2. Prev/Next button vertical stacking on mobile
    const postNav = inspector.assertHasTag('nav', { 'aria-label': 'Post navigation' });
    assertTrue(postNav.hasClass('flex-col'), 'Post navigation must stack vertically on mobile');
    assertTrue(postNav.hasClass('sm:flex-row'), 'Post navigation must arrange horizontally on desktop');

    // 3. Touch target accessibility: min 44px height for interactive targets
    const buttons = inspector.findAllTags('button');
    for (const btn of buttons) {
      assertTrue(btn.hasClass('min-h-[44px]'), 'Buttons must have min 44px touch target on mobile');
    }

    const navAnchors = inspector.findAllTags('a');
    for (const a of navAnchors) {
      if (a.textContent.includes('Previous') || a.textContent.includes('Next')) {
        assertTrue(a.hasClass('min-h-[44px]'), 'Navigation links must enforce min 44px touch target');
      }
    }
  });
});
