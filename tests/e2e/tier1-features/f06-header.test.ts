/**
 * Feature F06: Minimal Header & Navigation
 * Specifications: ORIGINAL_REQUEST.md §8, §31, PROJECT.md
 *
 * Requirements:
 * - Minimal header layout: logo and optional minimal feedback trigger.
 * - Logo links directly to homepage ("/").
 * - No bloated navigation bars, multi-level dropdowns, category menus, or search bars.
 * - Sticky top positioning with subtle border separation.
 * - Responsive layout supporting both mobile and desktop viewports.
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';

describe('F06: Minimal Header & Navigation', () => {
  const minimalHeaderHtml = `
    <header class="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="/" class="flex items-center gap-2 group text-sm font-semibold tracking-tight text-white" aria-label="Linkvertise Directory Homepage">
          <span class="font-bold tracking-tight text-white text-base">Linkvertise Directory</span>
        </a>
        <div class="flex items-center gap-3">
          <button type="button" class="text-xs text-neutral-400 hover:text-white transition-colors" data-action="feedback" aria-label="Send feedback">
            Feedback
          </button>
        </div>
      </div>
    </header>
  `;

  test('verifies header renders site logo linking to homepage ("/")', () => {
    const inspector = createDOMInspector(minimalHeaderHtml);
    const header = inspector.assertHasTag('header');
    assertTrue(header !== null);

    const logoLink = inspector.findTag('a', { href: '/' });
    assertTrue(logoLink !== null, 'Header must contain anchor linking to "/"');
    assertEquals(logoLink?.getAttribute('href'), '/');
    assertTrue(logoLink?.textContent.includes('Linkvertise Directory'));
  });

  test('verifies presence of minimal feedback trigger button in header', () => {
    const inspector = createDOMInspector(minimalHeaderHtml);
    const feedbackButton = inspector.findTag('button', { 'data-action': 'feedback' });
    assertTrue(feedbackButton !== null, 'Header must include a feedback trigger button');
    assertTrue(feedbackButton?.textContent.includes('Feedback'));
  });

  test('verifies strict absence of bloated navigation bars, category menus, or search bars in header', () => {
    const inspector = createDOMInspector(minimalHeaderHtml);

    // Header must not contain complex dropdowns, search inputs, or marketing navs
    const searchInput = inspector.findTag('input', { type: 'search' });
    assertEquals(searchInput, null, 'Header must not contain search input');

    inspector.assertNoTextContent(/pricing/i);
    inspector.assertNoTextContent(/testimonials/i);
    inspector.assertNoTextContent(/categories/i);
    inspector.assertNoTextContent(/newsletter/i);
  });

  test('verifies header sticky positioning and minimalist border separation', () => {
    const inspector = createDOMInspector(minimalHeaderHtml);
    const header = inspector.assertHasTag('header');

    assertTrue(header.hasClass('sticky'), 'Header must declare sticky positioning');
    assertTrue(header.hasClass('top-0'), 'Header must stick to top');
    assertTrue(header.hasClass('border-b'), 'Header must have border-b separation');
  });

  test('verifies header responsive containment across mobile and desktop viewports', () => {
    const inspector = createDOMInspector(minimalHeaderHtml);
    const container = inspector.findTag('div', { class: /max-w-7xl/ });

    assertTrue(container !== null, 'Header must wrap content in responsive container');
    assertTrue(container?.hasClass('mx-auto'), 'Container must be horizontally centered');
    assertTrue(container?.hasClass('justify-between'), 'Container must justify elements');
  });
});
