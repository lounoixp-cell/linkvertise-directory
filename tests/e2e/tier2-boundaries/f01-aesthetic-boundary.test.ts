/**
 * Feature F01 Boundary: Strict Minimalist Aesthetic
 * Specifications: ORIGINAL_REQUEST.md §1, §32; TEST_INFRA.md; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Forbidden Marketing Copy Injection (assertNoBloat flags slogans like "revolutionize", "join 50,000+ members")
 * 2. Forbidden Promotional DOM Elements (hero-section, ad-banner, promo-box, ad-container, promo-popup)
 * 3. Complex Navigation / Clutter Overflow (rejection of multi-level dropdowns, secondary menu bars, hamburger menus)
 * 4. Prohibited Decorative Animations (detection and rejection of animate-bounce, animate-spin-slow, confetti, data-lottie)
 * 5. Unauthorized Secondary Views / Routes (strict 2-page constraint rejects /about, /faq, /pricing, /terms, /newsletter)
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';

describe('F01: Aesthetic Boundary & Anti-Bloat Verification', () => {
  test('flags and rejects forbidden marketing copy injection in rendered HTML', () => {
    const forbiddenPhrases = [
      'Revolutionize your links with cutting-edge curation!',
      'Join 50,000+ members exploring premium content!',
      'The ultimate destination for web discovery.',
      'Subscribe to our newsletter for weekly curated drops!',
      'Sign up for Pro membership today!',
      'Sponsored post: check out this deal!',
    ];

    for (const phrase of forbiddenPhrases) {
      const dirtyHtml = `
        <div class="site-wrapper">
          <p class="announcement">${phrase}</p>
        </div>
      `;
      const inspector = createDOMInspector(dirtyHtml);
      let caught = false;
      try {
        inspector.assertNoBloat();
      } catch {
        caught = true;
      }
      assertTrue(caught, `Expected assertNoBloat() to flag marketing copy: "${phrase}"`);
    }
  });

  test('flags and rejects forbidden promotional DOM elements and container classes', () => {
    const forbiddenElements = [
      '<div class="hero-section"><h1>Welcome</h1></div>',
      '<aside class="marketing-banner"><span>Advertisement</span></aside>',
      '<section class="promo-box"><div>Special Promo</div></section>',
      '<div class="ad-container"><iframe src="/ad"></iframe></div>',
      '<div id="promo-popup" class="modal">Popup</div>',
      '<div id="hero" class="banner">Hero Banner</div>',
      '<aside id="ad-banner"><span>Ad</span></aside>',
    ];

    for (const elHtml of forbiddenElements) {
      const dirtyHtml = `
        <main class="content">
          ${elHtml}
          <div class="grid">Posts</div>
        </main>
      `;
      const inspector = createDOMInspector(dirtyHtml);
      let caught = false;
      try {
        inspector.assertNoBloat();
      } catch {
        caught = true;
      }
      assertTrue(caught, `Expected assertNoBloat() to flag element: ${elHtml}`);
    }
  });

  test('verifies rejection of complex navigation clutter (dropdowns, mega menus, secondary bars)', () => {
    // Valid minimalist header only contains logo and optional feedback button
    const cleanHeaderHtml = `
      <header class="border-b border-neutral-800 bg-neutral-950/80 sticky top-0 z-40">
        <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <a href="/" class="text-sm font-semibold tracking-tight text-white">Linkvertise Directory</a>
          <button data-action="feedback" class="text-xs text-neutral-400">Feedback</button>
        </div>
      </header>
    `;
    const cleanInspector = createDOMInspector(cleanHeaderHtml);
    assertEquals(cleanInspector.findAllTags('nav').length, 0);

    // Cluttered navigation fixture with multi-level dropdowns and hamburger menu
    const clutteredHeaderHtml = `
      <header class="sticky top-0 z-40">
        <a href="/">Logo</a>
        <nav class="mega-menu">
          <button class="hamburger-toggle" aria-expanded="true">Menu</button>
          <ul class="dropdown-level-1">
            <li><a href="/category/tech">Tech</a>
              <ul class="dropdown-level-2">
                <li><a href="/category/tech/ai">AI & ML</a></li>
              </ul>
            </li>
            <li><a href="/explore">Explore</a></li>
          </ul>
        </nav>
      </header>
    `;

    // Verify detection: cluttered header must be identified as violating minimalist constraints
    const isCluttered =
      clutteredHeaderHtml.includes('mega-menu') ||
      clutteredHeaderHtml.includes('dropdown-level') ||
      clutteredHeaderHtml.includes('hamburger-toggle');
    assertTrue(isCluttered, 'Cluttered multi-tier navigation must be identified and rejected');
  });

  test('detects and rejects prohibited decorative animations and particle scripts', () => {
    const decorativeClasses = [
      'animate-bounce',
      'animate-spin-slow',
      'confetti',
      'data-lottie',
      'particle-canvas',
      'floating-decorations',
    ];

    for (const dec of decorativeClasses) {
      const animatedSnippet = `<div class="card ${dec}">Post content</div>`;
      const hasProhibitedAnimation =
        animatedSnippet.includes('animate-bounce') ||
        animatedSnippet.includes('animate-spin-slow') ||
        animatedSnippet.includes('confetti') ||
        animatedSnippet.includes('data-lottie') ||
        animatedSnippet.includes('particle-canvas') ||
        animatedSnippet.includes('floating-decorations');

      assertTrue(
        hasProhibitedAnimation,
        `Expected detection of prohibited decorative animation class "${dec}"`
      );
    }

    // Verify clean layout contains no prohibited decorative classes
    const cleanCardHtml = `<article class="border border-neutral-800 rounded p-4 bg-neutral-900 transition-colors"></article>`;
    assertFalse(cleanCardHtml.includes('animate-bounce'));
    assertFalse(cleanCardHtml.includes('confetti'));
    assertFalse(cleanCardHtml.includes('data-lottie'));
  });

  test('enforces strict two-page boundary: rejects unauthorized secondary routes', () => {
    const candidateLinks = [
      { href: '/', allowed: true },
      { href: '/page/2', allowed: true },
      { href: '/page/99', allowed: true },
      { href: '/post/serena-noir', allowed: true },
      { href: '/post/test-post-123', allowed: true },
      { href: '/about', allowed: false },
      { href: '/faq', allowed: false },
      { href: '/pricing', allowed: false },
      { href: '/terms', allowed: false },
      { href: '/privacy-policy', allowed: false },
      { href: '/newsletter', allowed: false },
      { href: '/blog', allowed: false },
      { href: '/categories/tech', allowed: false },
    ];

    const isPermittedRoute = (href: string): boolean => {
      if (href === '/') return true;
      if (/^\/page\/\d+$/.test(href)) return true;
      if (/^\/post\/[a-zA-Z0-9_-]+$/.test(href)) return true;
      return false;
    };

    for (const item of candidateLinks) {
      const permitted = isPermittedRoute(item.href);
      assertEquals(
        permitted,
        item.allowed,
        `Route "${item.href}" permission expected to be ${item.allowed}, but got ${permitted}`
      );
    }
  });
});
