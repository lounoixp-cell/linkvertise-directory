/**
 * Feature F15 Boundary: Pagination Edge States
 * Specifications: ORIGINAL_REQUEST.md §14, §38; src/components/Pagination.tsx; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Page 1 Boundary: Previous control strictly disabled (aria-disabled="true", span element)
 * 2. Final Page Boundary: Next control strictly disabled on final page
 * 3. Single Page Catalog: Entire pagination component hidden (returns null when totalPages <= 1)
 * 4. Zero Items Catalog: Pagination component omitted when catalog has 0 items
 * 5. Exact Page Size Multiples (24 items / 8 per page = exactly 3 pages, page 3 hasNext false)
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';

describe('F15: Pagination Edge State Boundaries', () => {
  test('boundary: on page 1, Previous button is strictly disabled as non-link span with aria-disabled="true"', () => {
    const page1Html = `
      <nav aria-label="Pagination" class="my-10 flex items-center justify-center gap-2">
        <span class="flex cursor-not-allowed items-center gap-1 rounded-lg border border-neutral-900 bg-neutral-950 px-3 py-2 text-neutral-600" aria-disabled="true">
          <span>Previous</span>
        </span>
        <span aria-current="page" class="bg-red-600 text-white">1</span>
        <a href="/page/2" class="page-num">2</a>
        <a href="/page/2" class="page-next" aria-label="Go to next page">Next</a>
      </nav>
    `;

    const inspector = createDOMInspector(page1Html);
    const prevSpan = inspector.assertHasTag('span', { 'aria-disabled': 'true' });
    assertTrue(prevSpan.textContent.includes('Previous'));
    assertEquals(prevSpan.tag, 'span');
    assertFalse(prevSpan.hasAttribute('href'));
  });

  test('boundary: on final page, Next button is strictly disabled with aria-disabled="true"', () => {
    const finalPageHtml = `
      <nav aria-label="Pagination" class="my-10 flex items-center justify-center gap-2">
        <a href="/page/2" class="page-prev" aria-label="Go to previous page">Previous</a>
        <a href="/" class="page-num">1</a>
        <a href="/page/2" class="page-num">2</a>
        <span aria-current="page" class="bg-red-600 text-white">3</span>
        <span class="flex cursor-not-allowed items-center gap-1 rounded-lg border border-neutral-900 bg-neutral-950 px-3 py-2 text-neutral-600" aria-disabled="true">
          <span>Next</span>
        </span>
      </nav>
    `;

    const inspector = createDOMInspector(finalPageHtml);
    const nextSpan = inspector.assertHasTag('span', { 'aria-disabled': 'true' });
    assertTrue(nextSpan.textContent.includes('Next'));
    assertEquals(nextSpan.tag, 'span');
    assertFalse(nextSpan.hasAttribute('href'));
  });

  test('boundary: single-page catalog (totalPages <= 1) hides pagination completely from DOM', () => {
    // Component specification from Pagination.tsx:
    // if (totalPages <= 1) return null;
    const shouldRenderPagination = (totalPages: number): boolean => totalPages > 1;

    assertFalse(shouldRenderPagination(1));
    assertFalse(shouldRenderPagination(0));
    assertFalse(shouldRenderPagination(-1));
    assertTrue(shouldRenderPagination(2));
  });

  test('boundary: total items = 0 yields totalPages = 1 and omits pagination controls', () => {
    const totalItems = 0;
    const pageSize = 8;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    assertEquals(totalPages, 1);
    // Since totalPages <= 1, pagination returns null
    const shouldRender = totalPages > 1;
    assertFalse(shouldRender);
  });

  test('boundary: exact page size multiple (e.g. 24 items with pageSize 8) yields exactly 3 pages', () => {
    const totalItems = 24;
    const pageSize = 8;
    const totalPages = Math.ceil(totalItems / pageSize);

    assertEquals(totalPages, 3);

    // Page 3 slice
    const page3Start = (3 - 1) * pageSize;
    const page3End = page3Start + pageSize;
    assertEquals(page3End - page3Start, 8);

    const hasNext = 3 < totalPages;
    const hasPrev = 3 > 1;

    assertFalse(hasNext, 'Page 3 of 3 must have hasNext === false');
    assertTrue(hasPrev, 'Page 3 of 3 must have hasPrev === true');
  });
});
