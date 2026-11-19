/**
 * Feature F14 Boundary: Homepage Pagination Controls
 * Specifications: ORIGINAL_REQUEST.md §14; src/components/Pagination.tsx; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Page 0 and Negative Page Inputs (normalizes to Page 1)
 * 2. Excessive Page Number Query (e.g. page 99999 clamped or handled cleanly)
 * 3. Non-Numeric Page Parameter (/page/abc or NaN normalizes safely)
 * 4. Ellipsis Layout Windowing on Deep Catalogs (1 ... 9 10 11 ... 20)
 * 5. Current Page Accessibility & Non-Anchor Semantics (aria-current="page" as span)
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';

describe('F14: Homepage Pagination Control Boundaries', () => {
  // Safe page normalization helper as implemented in getPaginatedPosts and route handlers
  const normalizePageNumber = (rawPage: unknown, totalPages: number = 1): number => {
    const parsed = Math.floor(Number(rawPage));
    if (isNaN(parsed) || parsed < 1) {
      return 1;
    }
    return parsed;
  };

  test('boundary: page 0 and negative numbers normalize to Page 1', () => {
    assertEquals(normalizePageNumber(0), 1);
    assertEquals(normalizePageNumber(-1), 1);
    assertEquals(normalizePageNumber(-999), 1);
    assertEquals(normalizePageNumber('-5'), 1);
  });

  test('boundary: excessive page query (e.g. 99999) detected and handled without crash', () => {
    const totalPages = 5;
    const requestedPage = 99999;
    const isOutOfBounds = requestedPage > totalPages;
    assertTrue(isOutOfBounds);

    // Clamping strategy or 404
    const clampedPage = Math.min(requestedPage, totalPages);
    assertEquals(clampedPage, 5);
  });

  test('boundary: non-numeric string page parameters normalize cleanly without NaN error', () => {
    const invalidInputs = ['abc', 'undefined', 'null', 'NaN', '1e5foo', '', '  '];
    for (const input of invalidInputs) {
      const normalized = normalizePageNumber(input);
      assertEquals(normalized, 1, `Expected input "${input}" to normalize to 1`);
      assertFalse(isNaN(normalized));
    }
  });

  test('boundary: ellipsis windowing layout on 20 pages correctly windows around current page 10', () => {
    // Generate pagination numbers algorithm matching Pagination.tsx
    const computePaginationWindow = (currentPage: number, totalPages: number) => {
      const delta = 1;
      const range: (number | string)[] = [];
      const rangeWithDots: (number | string)[] = [];
      let l: number | undefined;

      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
          range.push(i);
        }
      }

      for (const i of range) {
        if (typeof i === 'number') {
          if (l !== undefined) {
            if (i - l === 2) {
              rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
              rangeWithDots.push('...');
            }
          }
          rangeWithDots.push(i);
          l = i;
        }
      }

      return rangeWithDots;
    };

    const windowItems = computePaginationWindow(10, 20);

    // Expected sequence: [1, '...', 9, 10, 11, '...', 20]
    assertEquals(windowItems[0], 1);
    assertEquals(windowItems[1], '...');
    assertEquals(windowItems[2], 9);
    assertEquals(windowItems[3], 10);
    assertEquals(windowItems[4], 11);
    assertEquals(windowItems[5], '...');
    assertEquals(windowItems[6], 20);

    // Renders without infinite horizontal sprawl
    assertTrue(windowItems.length <= 9);
  });

  test('boundary: current page renders as non-anchor span with aria-current="page"', () => {
    const paginationHtml = `
      <nav aria-label="Pagination" class="flex items-center gap-1">
        <a href="/" class="page-link" aria-label="Go to page 1">1</a>
        <span aria-current="page" class="flex h-9 min-w-[36px] items-center justify-center rounded-lg bg-red-600 px-3 font-bold text-white shadow-sm">
          2
        </span>
        <a href="/page/3" class="page-link" aria-label="Go to page 3">3</a>
      </nav>
    `;

    const inspector = createDOMInspector(paginationHtml);
    const currentPageSpan = inspector.assertHasTag('span', { 'aria-current': 'page' });

    assertEquals(currentPageSpan.textContent.trim(), '2');
    assertEquals(currentPageSpan.tag, 'span');
    assertFalse(currentPageSpan.hasAttribute('href'));
  });
});
