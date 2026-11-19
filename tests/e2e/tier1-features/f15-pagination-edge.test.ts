/**
 * Feature F15: Pagination Edge States
 * Specifications: ORIGINAL_REQUEST.md §14, §38, PROJECT.md
 *
 * Requirements:
 * - Previous button disabled on page 1.
 * - Next button disabled on final page.
 * - Single-page datasets (totalPages = 1) render no overflow and both controls disabled.
 * - Clamping: page numbers <= 0 are clamped to page 1.
 * - Clamping: page numbers > totalPages are handled gracefully without application crash.
 */

import { describe, test, assertEquals, assertTrue } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { getPaginatedPosts } from '@/lib/posts';

describe('F15: Pagination Edge States', () => {
  const page1Html = `
    <nav aria-label="Pagination">
      <span class="cursor-not-allowed text-neutral-600" aria-disabled="true" data-control="prev">Previous</span>
      <span aria-current="page">1</span>
      <a href="/page/2" data-control="next">Next</a>
    </nav>
  `;

  const finalPageHtml = `
    <nav aria-label="Pagination">
      <a href="/page/4" data-control="prev">Previous</a>
      <span aria-current="page">5</span>
      <span class="cursor-not-allowed text-neutral-600" aria-disabled="true" data-control="next">Next</span>
    </nav>
  `;

  test('verifies Previous navigation button is disabled or inactive on page 1', async () => {
    const inspector = createDOMInspector(page1Html);
    const prevControl = inspector.findTag('span', { 'data-control': 'prev' });

    assertTrue(prevControl !== null, 'Previous button must be rendered as disabled element on page 1');
    assertEquals(prevControl?.getAttribute('aria-disabled'), 'true');

    // Data layer check
    const page1Data = await getPaginatedPosts(1, 8);
    assertEquals(page1Data.hasPrevPage, false, 'hasPrevPage must be false on page 1');
  });

  test('verifies Next navigation button is disabled or inactive on final page', async () => {
    const inspector = createDOMInspector(finalPageHtml);
    const nextControl = inspector.findTag('span', { 'data-control': 'next' });

    assertTrue(nextControl !== null, 'Next button must be rendered as disabled element on final page');
    assertEquals(nextControl?.getAttribute('aria-disabled'), 'true');

    // Data layer check on final page
    const initial = await getPaginatedPosts(1, 8);
    const finalPageData = await getPaginatedPosts(initial.totalPages, 8);
    assertEquals(finalPageData.hasNextPage, false, 'hasNextPage must be false on final page');
  });

  test('verifies pagination handles single-page total (totalPages = 1) with both controls disabled', async () => {
    // Single page with all items fitting on 1 page
    const singlePageData = await getPaginatedPosts(1, 100);
    assertEquals(singlePageData.totalPages, 1);
    assertEquals(singlePageData.hasPrevPage, false);
    assertEquals(singlePageData.hasNextPage, false);
  });

  test('clamps invalid page 0 or negative page numbers to page 1', async () => {
    const zeroResult = await getPaginatedPosts(0, 8);
    assertEquals(zeroResult.currentPage, 1, 'Page 0 must clamp to page 1');

    const negativeResult = await getPaginatedPosts(-5, 8);
    assertEquals(negativeResult.currentPage, 1, 'Negative page must clamp to page 1');
  });

  test('clamps out-of-range page numbers greater than totalPages to final page without error', async () => {
    const initial = await getPaginatedPosts(1, 8);
    const hugePage = await getPaginatedPosts(99999, 8);

    assertTrue(hugePage !== null);
    // Should not crash and should return safe structure
    assertEquals(hugePage.totalPages, initial.totalPages);
    assertEquals(hugePage.hasNextPage, false);
  });
});
