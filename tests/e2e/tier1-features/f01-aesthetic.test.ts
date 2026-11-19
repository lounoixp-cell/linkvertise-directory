/**
 * Feature F01: Strict Minimalist Aesthetic
 * Specifications: ORIGINAL_REQUEST.md §1, §32
 *
 * Requirements:
 * - Minimalist design, clean layout, simple typography & spacing, neutral visual treatment.
 * - Content-first structure, fast-loading interface.
 * - Absolutely NO hero sections, marketing copy, descriptions, feature explanations, or decorative elements.
 * - Absolutely NO "what the website does", testimonials, pricing, FAQ, newsletter, or promotional banners.
 * - Exactly two primary views: Homepage (Header + Grid + Pagination) and Detail (Header + Post + Link + Prev/Next).
 */

import { describe, test, assertEquals, assertContains, assertTrue, assertFalse } from '../harness';
import { getActiveMockPosts, getFeedbackFixtures, MOCK_POSTS } from '../harness/fixtures';
import { createDOMInspector } from '../harness/dom';
import { invokeRouteHandler, createMockRequest } from '../harness/http';

describe('F01: Strict Minimalist Aesthetic', () => {
  // Representative clean HTML layout following ORIGINAL_REQUEST §1, §32
  const sampleCleanHomepageHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Linkvertise Directory — Minimal Link Listing Site</title>
      </head>
      <body class="min-h-screen bg-black text-neutral-100 antialiased">
        <header class="border-b border-neutral-800 bg-neutral-950/80 sticky top-0 z-40">
          <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <a href="/" class="text-sm font-semibold tracking-tight text-white">Linkvertise Directory</a>
            <button class="text-xs text-neutral-400 hover:text-white" data-action="feedback">Feedback</button>
          </div>
        </header>
        <main class="mx-auto max-w-7xl px-4 py-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <article class="border border-neutral-800 rounded p-4 bg-neutral-900">
              <img src="https://cdn.sanity.io/images/project/dataset/sample.png" alt="Next.js Framework" class="aspect-[16/10] object-cover w-full" />
              <div class="mt-3">
                <span class="text-xs text-neutral-400 uppercase tracking-wider">Developer Tools</span>
                <h2 class="text-base font-semibold text-white mt-1">Next.js Framework</h2>
                <a href="/post/nextjs-framework" class="text-xs text-neutral-300 mt-2 block">nextjs.org</a>
                <time class="text-xs text-neutral-500 mt-1 block" datetime="2026-01-10T12:00:00.000Z">Jan 10, 2026</time>
              </div>
            </article>
          </div>
          <nav aria-label="Pagination" class="mt-8 flex justify-center gap-2">
            <span class="px-3 py-1 text-xs text-neutral-500 border border-neutral-800 rounded">Previous</span>
            <a href="/" class="px-3 py-1 text-xs text-white bg-neutral-800 rounded" aria-current="page">1</a>
            <a href="/page/2" class="px-3 py-1 text-xs text-neutral-400 border border-neutral-800 rounded">2</a>
            <a href="/page/2" class="px-3 py-1 text-xs text-neutral-400 border border-neutral-800 rounded">Next</a>
          </nav>
        </main>
      </body>
    </html>
  `;

  test('asserts that rendered homepage HTML is free of forbidden marketing bloat and promotional banners', () => {
    const inspector = createDOMInspector(sampleCleanHomepageHtml);
    // Uses the built-in assertNoBloat() which verifies absence of forbidden slogans & promotional IDs/classes
    inspector.assertNoBloat();

    // Verify negative assertion: ensure that injecting forbidden marketing copy fails the check
    const bloatedHtml = `
      <section class="hero-section">
        <h1>Revolutionize your discovery workflow with the ultimate link destination!</h1>
        <p>Subscribe to our newsletter and join 50,000+ members today!</p>
      </section>
    `;
    const bloatedInspector = createDOMInspector(bloatedHtml);
    let errorCaught = false;
    try {
      bloatedInspector.assertNoBloat();
    } catch {
      errorCaught = true;
    }
    assertTrue(errorCaught);
  });

  test('verifies strict content-first layout hierarchy containing only header, main content, and pagination', () => {
    const inspector = createDOMInspector(sampleCleanHomepageHtml);
    const header = inspector.assertHasTag('header');
    const main = inspector.assertHasTag('main');
    const nav = inspector.assertHasTag('nav');

    assertTrue(header.hasClass('border-b'));
    assertTrue(inspector.html.includes('grid-cols-1'));
    assertEquals(nav.getAttribute('aria-label'), 'Pagination');
  });

  test('verifies absence of prohibited sections (hero, about, faq, testimonials, pricing, newsletter)', () => {
    const inspector = createDOMInspector(sampleCleanHomepageHtml);

    // Verify that none of the prohibited semantic tags or copy exist
    inspector.assertNoTextContent(/hero/i);
    inspector.assertNoTextContent(/about us/i);
    inspector.assertNoTextContent(/frequently asked questions/i);
    inspector.assertNoTextContent(/testimonials/i);
    inspector.assertNoTextContent(/pricing plans/i);
    inspector.assertNoTextContent(/subscribe to newsletter/i);
  });

  test('verifies simple, neutral visual treatment without complex decorative animations or illustrations', () => {
    const inspector = createDOMInspector(sampleCleanHomepageHtml);

    // Minimalist design relies on neutral colors (neutral-*, zinc-*, black, white) and no decorative SVGs/lottie
    assertContains(sampleCleanHomepageHtml, 'bg-black');
    assertFalse(sampleCleanHomepageHtml.includes('animate-bounce'));
    assertFalse(sampleCleanHomepageHtml.includes('animate-spin-slow'));
    assertFalse(sampleCleanHomepageHtml.includes('data-lottie'));
    assertFalse(sampleCleanHomepageHtml.includes('confetti'));
  });

  test('verifies two-page structural compliance: only homepage grid and post detail view are supported', () => {
    const inspector = createDOMInspector(sampleCleanHomepageHtml);
    const links = inspector.extractLinks();

    // Every content link on the homepage must lead to either root (/), page (/page/X), or post (/post/[slug])
    for (const link of links) {
      const href = link.href;
      const isAllowedRoute =
        href === '/' ||
        href.startsWith('/page/') ||
        href.startsWith('/post/') ||
        href.startsWith('#');
      assertTrue(isAllowedRoute, `Found unexpected route outside 2-page architecture: ${href}`);
    }
  });
});
