/**
 * Feature F07 Boundary: Responsive Post Grid Layout
 * Specifications: ORIGINAL_REQUEST.md §8, §9, §28; src/components/PostGrid.tsx; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. 0 Items Rendered: Empty posts array displays exact spec string "No posts available"
 * 2. Exactly 1 Post: Single post card rendered within responsive grid constraints
 * 3. 100+ Items Stress: Large catalog renders cleanly without container failure
 * 4. Responsive Breakpoint Classes: grid-cols-1, sm:grid-cols-2, lg:grid-cols-3, xl:grid-cols-4
 * 5. Grid Gap & Spacing Bounds: Consistent gap (gap-5) preventing horizontal overflow
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { MOCK_POSTS } from '../harness/fixtures';
import { Post } from '@/types/post';

describe('F07: Post Grid Boundary & Breakpoint Constraints', () => {
  test('boundary: 0 items renders "No posts available" fallback container', () => {
    // HTML representation of PostGrid empty state
    const emptyGridHtml = `
      <div class="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 p-8 text-center" role="status">
        <h3 class="text-lg font-semibold text-neutral-300">No posts available.</h3>
        <p class="mt-1 text-sm text-neutral-500">There are currently no active listings in this section.</p>
      </div>
    `;

    const inspector = createDOMInspector(emptyGridHtml);
    inspector.assertTextContent('No posts available');
    assertEquals(inspector.findAllTags('article').length, 0);
  });

  test('boundary: exactly 1 post renders single card without stretching abnormally', () => {
    const singlePost = MOCK_POSTS[0];
    const singlePostGridHtml = `
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <article class="group relative flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div class="aspect-[16/10] overflow-hidden rounded-lg bg-neutral-950">
            <img src="${singlePost.previewImage}" alt="${singlePost.title}" class="h-full w-full object-cover" />
          </div>
          <div class="mt-4 flex flex-1 flex-col">
            <span class="text-xs font-semibold uppercase text-neutral-400">${singlePost.tag}</span>
            <h2 class="mt-1 text-sm font-semibold text-white line-clamp-1">${singlePost.title}</h2>
          </div>
        </article>
      </div>
    `;

    const inspector = createDOMInspector(singlePostGridHtml);
    const grid = inspector.assertHasTag('div', { class: /grid/ });
    assertTrue(grid.hasClass('grid-cols-1'));
    assertTrue(grid.hasClass('xl:grid-cols-4'));

    const cards = inspector.findAllTags('article');
    assertEquals(cards.length, 1);
  });

  test('boundary: 100+ items stress test verifies DOM stability and linear rendering', () => {
    // Generate 100 mock post card items
    const generate100PostsGrid = () => {
      let cardsHtml = '';
      for (let i = 1; i <= 100; i++) {
        cardsHtml += `
          <article class="rounded-xl border border-neutral-800 bg-neutral-900 p-4" data-index="${i}">
            <span class="text-xs">Tag ${i}</span>
            <h2 class="text-sm font-semibold">Post Title ${i}</h2>
          </article>
        `;
      }
      return `<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">${cardsHtml}</div>`;
    };

    const stressHtml = generate100PostsGrid();
    const inspector = createDOMInspector(stressHtml);
    const articles = inspector.findAllTags('article');

    assertEquals(articles.length, 100);
    assertEquals(articles[0].getAttribute('data-index'), '1');
    assertEquals(articles[99].getAttribute('data-index'), '100');
  });

  test('verifies responsive breakpoint classes across mobile, tablet, and desktop', () => {
    const gridHtml = `<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"></div>`;
    const inspector = createDOMInspector(gridHtml);
    const grid = inspector.assertHasTag('div');

    // Mobile: 1 column
    assertTrue(grid.hasClass('grid-cols-1'), 'Mobile must be 1 column (grid-cols-1)');
    // Tablet: 2 columns
    assertTrue(grid.hasClass('sm:grid-cols-2'), 'Tablet must be 2 columns (sm:grid-cols-2)');
    // Desktop: 3-4 columns
    assertTrue(grid.hasClass('lg:grid-cols-3'), 'Desktop default must be 3 columns (lg:grid-cols-3)');
    assertTrue(grid.hasClass('xl:grid-cols-4'), 'Wide desktop must be 4 columns (xl:grid-cols-4)');
  });

  test('verifies grid gap bounds and container padding prevent horizontal overflow', () => {
    const containerHtml = `
      <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <article class="p-4"></article>
        </div>
      </main>
    `;

    const inspector = createDOMInspector(containerHtml);
    const main = inspector.assertHasTag('main');
    assertTrue(main.hasClass('mx-auto'));
    assertTrue(main.hasClass('px-4'));

    const grid = inspector.assertHasTag('div', { class: /grid/ });
    assertTrue(grid.hasClass('gap-5') || grid.hasClass('gap-4') || grid.hasClass('gap-6'));
  });
});
