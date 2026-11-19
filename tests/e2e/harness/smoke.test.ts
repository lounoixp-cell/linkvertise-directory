/**
 * Smoke Test Suite for E2E Test Harness & Utilities
 *
 * Verifies core registration, all assertion primitives, HTTP helpers,
 * DOM inspector, and mock fixtures.
 */

import {
  describe,
  it,
  assert,
  assertEquals,
  assertNotEquals,
  assertContains,
  assertNotContains,
  assertMatches,
  assertThrows,
  assertRejects,
  assertNull,
  assertNotNull,
  assertTrue,
  assertFalse,
  beforeEach,
  afterEach,
} from './index';
import { createDOMInspector } from './dom';
import { createMockRequest, invokeRouteHandler, TestResponse } from './http';
import {
  MOCK_POSTS,
  getActiveMockPosts,
  FEEDBACK_FIXTURES,
  REVALIDATE_FIXTURES,
} from './fixtures';

describe('Test Harness Core Assertions', () => {
  let hookCounter = 0;

  beforeEach(() => {
    hookCounter++;
  });

  afterEach(() => {
    hookCounter = 0;
  });

  it('verifies beforeEach and truthy assertions', () => {
    assertEquals(hookCounter, 1);
    assert(true);
    assertTrue(true);
    assertFalse(false);
  });

  it('verifies deep equality of objects, arrays, and primitives', () => {
    assertEquals(42, 42);
    assertEquals('linkvertise', 'linkvertise');
    assertEquals({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] });
    assertNotEquals({ a: 1 }, { a: 2 });
  });

  it('verifies containment in strings, arrays, and sets', () => {
    assertContains('Linkvertise Directory Minimal Site', 'Minimal');
    assertNotContains('Linkvertise Directory Minimal Site', 'Superfluous Marketing');

    assertContains(['nextjs', 'tailwind', 'sanity'], 'sanity');
    assertNotContains(['nextjs', 'tailwind', 'sanity'], 'wordpress');

    const set = new Set(['cat1', 'cat2']);
    assertContains(set, 'cat1');
    assertNotContains(set, 'cat3');
  });

  it('verifies regular expression matching', () => {
    assertMatches('https://nextjs.org', /^https:\/\//);
    assertMatches('/post/sample-slug-123', /^\/post\/[a-z0-9-]+$/);
  });

  it('verifies null and not-null assertions', () => {
    assertNull(null);
    assertNotNull('value');
    assertNotNull({});
  });

  it('verifies synchronous assertThrows exceptions', () => {
    assertThrows(() => {
      throw new Error('Custom validation error: URL scheme not allowed');
    }, 'Custom validation error');

    assertThrows(() => {
      throw new TypeError('Expected type string');
    }, TypeError);
  });

  it('verifies asynchronous assertRejects exceptions', async () => {
    await assertRejects(async () => {
      await Promise.reject(new Error('Async network timeout'));
    }, 'Async network timeout');
  });
});

describe('DOM Inspector Utility', () => {
  const sampleHtml = `
    <header class="border-b py-4">
      <div class="logo">Linkvertise Directory</div>
      <button class="feedback-btn" data-action="open-feedback">Feedback</button>
    </header>
    <main class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <article class="post-card border rounded p-4">
        <img src="https://cdn.sanity.io/images/project/dataset/sample.png" alt="Sample Post" class="card-image" />
        <span class="tag">Developer Tools</span>
        <h2 class="title">Next.js Framework</h2>
        <a href="/post/nextjs-framework" class="detail-link">View Details</a>
        <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" class="external-link">Visit Website</a>
        <time datetime="2026-01-10T12:00:00.000Z">Jan 10, 2026</time>
      </article>
    </main>
    <footer class="footer p-4">
      <p>Minimal content-first directory.</p>
    </footer>
  `;

  it('parses HTML and finds elements by tag and attributes', () => {
    const inspector = createDOMInspector(sampleHtml);
    const header = inspector.findTag('header');
    assertNotNull(header);
    assertTrue(header!.hasClass('border-b'));

    const button = inspector.assertHasTag('button', { 'data-action': 'open-feedback' });
    assertEquals(button.textContent, 'Feedback');
  });

  it('asserts attribute values and regex matching', () => {
    const inspector = createDOMInspector(sampleHtml);
    inspector.assertAttribute('img', 'src', /^https:\/\/cdn\.sanity\.io\//);
    inspector.assertAttribute('img', 'alt', 'Sample Post');
    inspector.assertAttribute('a', 'href', '/post/nextjs-framework');
  });

  it('extracts links with target and rel security attributes', () => {
    const inspector = createDOMInspector(sampleHtml);
    const links = inspector.extractLinks();
    assertEquals(links.length, 2);

    const outboundLink = links.find((l) => l.href === 'https://nextjs.org');
    assertNotNull(outboundLink);
    assertEquals(outboundLink!.target, '_blank');
    assertEquals(outboundLink!.rel, 'noopener noreferrer');
  });

  it('extracts images with src and alt attributes', () => {
    const inspector = createDOMInspector(sampleHtml);
    const images = inspector.extractImages();
    assertEquals(images.length, 1);
    assertEquals(images[0].src, 'https://cdn.sanity.io/images/project/dataset/sample.png');
    assertEquals(images[0].alt, 'Sample Post');
  });

  it('verifies strict minimalist compliance with assertNoBloat()', () => {
    const inspector = createDOMInspector(sampleHtml);
    inspector.assertNoBloat();

    const bloatedHtml = '<div class="hero-section"><h1>Welcome to our revolutionary directory!</h1></div>';
    const bloatedInspector = createDOMInspector(bloatedHtml);
    assertThrows(() => {
      bloatedInspector.assertNoBloat();
    });
  });

  it('verifies responsive grid layout presence', () => {
    const inspector = createDOMInspector(sampleHtml);
    inspector.assertResponsiveGrid();
  });
});

describe('HTTP Route Handler and Mock Request Utility', () => {
  it('creates mock requests with headers, search parameters, and json body', async () => {
    const req = createMockRequest('/api/feedback', {
      method: 'POST',
      headers: { 'X-Custom-Auth': 'token123' },
      searchParams: { page: 2 },
      body: { message: 'Hello world' },
    });

    assertEquals(req.method, 'POST');
    assertEquals(req.headers.get('x-custom-auth'), 'token123');
    assertEquals(req.headers.get('content-type'), 'application/json');

    const url = new URL(req.url);
    assertEquals(url.searchParams.get('page'), '2');

    const bodyJson = await req.json();
    assertEquals(bodyJson, { message: 'Hello world' });
  });

  it('invokes mock Next.js route handler and wraps response in TestResponse', async () => {
    const mockFeedbackHandler = async (request: Request) => {
      const payload = await request.json();
      if (!payload.message) {
        return new Response(JSON.stringify({ error: 'Message is required' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, received: payload.message }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-custom-header': 'processed' },
      });
    };

    // Test success response
    const validResponse = await invokeRouteHandler(mockFeedbackHandler, '/api/feedback', {
      method: 'POST',
      body: { message: 'Test feedback payload' },
    });

    validResponse
      .expectStatus(200)
      .expectOk()
      .expectHeader('x-custom-header', 'processed');

    const validJson = await validResponse.json<{ success: boolean; received: string }>();
    assertEquals(validJson.success, true);
    assertEquals(validJson.received, 'Test feedback payload');

    // Test error response
    const errorResponse = await invokeRouteHandler(mockFeedbackHandler, '/api/feedback', {
      method: 'POST',
      body: { message: '' },
    });

    errorResponse.expectStatus(400);
    const errorJson = await errorResponse.json<{ error: string }>();
    assertEquals(errorJson.error, 'Message is required');
  });
});

describe('Mock Fixtures Integrity', () => {
  it('contains at least 15 mock posts matching Sanity schema', () => {
    assert(MOCK_POSTS.length >= 15, `Expected >= 15 posts, got ${MOCK_POSTS.length}`);

    for (const post of MOCK_POSTS) {
      assertNotNull(post.id);
      assertNotNull(post.slug);
      assertNotNull(post.title);
      assertNotNull(post.tag);
      assertNotNull(post.previewImage);
      assertNotNull(post.externalUrl);
      assertNotNull(post.destinationDomain);
      assertNotNull(post.publishedAt);
      assert(post.status === 'active' || post.status === 'archived');
      assert(typeof post.sortOrder === 'number');
    }
  });

  it('filters active posts and maintains deterministic sort order', () => {
    const activePosts = getActiveMockPosts();
    assert(activePosts.length > 0);

    for (let i = 0; i < activePosts.length - 1; i++) {
      const current = activePosts[i];
      const next = activePosts[i + 1];
      assert(
        current.sortOrder <= next.sortOrder,
        `Expected deterministic sort: ${current.slug} (${current.sortOrder}) <= ${next.slug} (${next.sortOrder})`
      );
    }

    // Verify archived post is excluded
    const archived = activePosts.find((p) => p.status === 'archived');
    assertNull(archived || null);
  });

  it('provides comprehensive feedback test fixtures', () => {
    assertNotNull(FEEDBACK_FIXTURES.validStandard.message);
    assertEquals(FEEDBACK_FIXTURES.invalidEmptyMessage.message, '');
    assert(FEEDBACK_FIXTURES.invalidTooLongMessage.message.length > 2000);
    assert(FEEDBACK_FIXTURES.invalidCrlfInjection.email.includes('\r\n'));
    assertEquals(FEEDBACK_FIXTURES.invalidHoneypotBot.hp_val, 'iamabot');
  });

  it('provides valid and invalid cache revalidation fixtures', () => {
    assertEquals(REVALIDATE_FIXTURES.validPostPayload._type, 'post');
    assertEquals(REVALIDATE_FIXTURES.validPostPayload.slug.current, 'nextjs-framework');
    assertEquals(REVALIDATE_FIXTURES.invalidNonPostType._type, 'author');
  });
});
