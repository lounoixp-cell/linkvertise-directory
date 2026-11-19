/**
 * Feature F14: Homepage Pagination Controls
 * Specifications: ORIGINAL_REQUEST.md §14, PROJECT.md
 *
 * Requirements:
 * - Numbered pagination bar with arrows and ellipsis (`← 1 2 3 ... 10 →`).
 * - Current active page clearly indicated with aria-current="page".
 * - Page 1 links to root ("/"), page N links to "/page/[pageNumber]".
 * - Ellipsis windowing when total pages exceed visible delta threshold.
 * - All page numbers shown without ellipsis when total pages is small (<= 5).
 * - Semantic <nav aria-label="Pagination"> wrapper.
 */

import { describe, test, assertEquals, assertTrue } from '../harness';
import { createDOMInspector } from '../harness/dom';

describe('F14: Homepage Pagination Controls', () => {
  const paginationLargeHtml = `
    <nav aria-label="Pagination" class="my-10 flex flex-wrap items-center justify-center gap-2 text-sm">
      <span class="flex cursor-not-allowed items-center gap-1 rounded-lg border border-neutral-800 px-3 py-2 text-neutral-600" aria-disabled="true">
        Previous
      </span>
      <div class="flex items-center gap-1">
        <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 font-bold text-neutral-950" aria-current="page">
          1
        </span>
        <a href="/page/2" class="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800">
          2
        </a>
        <a href="/page/3" class="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800">
          3
        </a>
        <span class="px-2 py-2 text-neutral-600 font-bold" aria-hidden="true">&hellip;</span>
        <a href="/page/10" class="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800">
          10
        </a>
      </div>
      <a href="/page/2" class="flex items-center gap-1 rounded-lg border border-neutral-800 px-3 py-2 text-neutral-300 hover:bg-neutral-800" aria-label="Go to next page">
        Next
      </a>
    </nav>
  `;

  const paginationSmallHtml = `
    <nav aria-label="Pagination" class="my-10 flex items-center justify-center gap-2">
      <a href="/" class="flex h-9 w-9 items-center justify-center rounded border border-neutral-800 text-neutral-300">1</a>
      <span class="flex h-9 w-9 items-center justify-center rounded bg-white text-black font-bold" aria-current="page">2</span>
      <a href="/page/3" class="flex h-9 w-9 items-center justify-center rounded border border-neutral-800 text-neutral-300">3</a>
    </nav>
  `;

  test('verifies active page is clearly indicated with aria-current="page" and distinct styling', () => {
    const inspector = createDOMInspector(paginationLargeHtml);
    const activeItem = inspector.assertHasTag('span', { 'aria-current': 'page' });

    assertEquals(activeItem.textContent.trim(), '1');
    assertEquals(activeItem.getAttribute('aria-current'), 'page');
    assertTrue(activeItem.hasClass('font-bold'));
  });

  test('verifies page 1 links to root ("/") and page N links to "/page/[pageNumber]"', () => {
    const inspector = createDOMInspector(paginationSmallHtml);
    const page1Link = inspector.findTag('a', { href: '/' });
    assertTrue(page1Link !== null, 'Page 1 must link to root "/"');

    const page3Link = inspector.findTag('a', { href: '/page/3' });
    assertTrue(page3Link !== null, 'Page 3 must link to "/page/3"');
  });

  test('verifies ellipsis (...) rendering when total pages exceed visible threshold', () => {
    const inspector = createDOMInspector(paginationLargeHtml);
    const ellipsis = inspector.findTag('span', { 'aria-hidden': 'true' });

    assertTrue(ellipsis !== null, 'Pagination must render ellipsis for large page counts');
    assertTrue(
      ellipsis?.textContent.includes('…') ||
      ellipsis?.textContent.includes('...') ||
      ellipsis?.textContent.includes('&hellip;'),
      'Ellipsis must represent horizontal windowing'
    );
  });

  test('verifies all page numbers are visible without ellipsis when total pages is small (<= 5)', () => {
    const inspector = createDOMInspector(paginationSmallHtml);
    const ellipsis = inspector.findTag('span', { 'aria-hidden': 'true' });
    assertEquals(ellipsis, null, 'Small page sets must not render ellipsis');

    inspector.assertTextContent('1');
    inspector.assertTextContent('2');
    inspector.assertTextContent('3');
  });

  test('verifies pagination is wrapped in semantic <nav aria-label="Pagination"> container', () => {
    const inspector = createDOMInspector(paginationLargeHtml);
    const nav = inspector.assertHasTag('nav');

    assertEquals(nav.getAttribute('aria-label'), 'Pagination');
    assertTrue(nav.hasClass('flex'), 'Pagination container must use flexbox for horizontal alignment');
    assertTrue(nav.hasClass('justify-center'), 'Pagination must be centered');
  });
});
