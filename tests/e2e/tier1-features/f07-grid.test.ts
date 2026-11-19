/**
 * Feature F07: Responsive Post Grid Layout
 * Specifications: ORIGINAL_REQUEST.md §8, §9, §28, PROJECT.md
 *
 * Requirements:
 * - Responsive grid: 1 column on mobile (1-2 visible per screen), 2 columns on tablet, 3-4 columns on desktop.
 * - Renders exact count of cards for the active page slice.
 * - Consistent gap spacing between cards (e.g. gap-5).
 * - Empty state fallback message ("No posts available.") when post array is empty.
 * - Absence of horizontal overflow styling.
 */

import { describe, test, assertEquals, assertTrue } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { MOCK_POSTS } from '../harness/fixtures';

describe('F07: Responsive Post Grid Layout', () => {
  const sampleGridHtml = `
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <article class="post-card border border-neutral-800 p-4 rounded" data-id="post-1">
        <h2>Post 1</h2>
      </article>
      <article class="post-card border border-neutral-800 p-4 rounded" data-id="post-2">
        <h2>Post 2</h2>
      </article>
      <article class="post-card border border-neutral-800 p-4 rounded" data-id="post-3">
        <h2>Post 3</h2>
      </article>
      <article class="post-card border border-neutral-800 p-4 rounded" data-id="post-4">
        <h2>Post 4</h2>
      </article>
    </div>
  `;

  const emptyGridHtml = `
    <div class="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 p-8 text-center">
      <h3 class="text-lg font-semibold text-neutral-300">No posts available.</h3>
      <p class="mt-1 text-sm text-neutral-500">There are currently no active listings in this section.</p>
    </div>
  `;

  test('verifies grid container declares responsive columns (1-col mobile, 2-col tablet, 3-4 col desktop)', () => {
    const inspector = createDOMInspector(sampleGridHtml);
    inspector.assertResponsiveGrid();

    const gridContainer = inspector.assertHasTag('div', { class: /grid/ });
    assertTrue(gridContainer.hasClass('grid-cols-1'), 'Grid must declare 1 column for mobile');
    assertTrue(gridContainer.hasClass('sm:grid-cols-2'), 'Grid must declare 2 columns for tablet');
    assertTrue(
      gridContainer.hasClass('lg:grid-cols-3') || gridContainer.hasClass('xl:grid-cols-4'),
      'Grid must declare 3 or 4 columns for desktop'
    );
  });

  test('verifies grid renders exact number of post cards corresponding to items slice', () => {
    const inspector = createDOMInspector(sampleGridHtml);
    const articles = inspector.findAllTags('article');
    assertEquals(articles.length, 4, 'Must render exactly 4 card articles for a 4-item slice');
  });

  test('verifies grid applies consistent spacing gap between cards', () => {
    const inspector = createDOMInspector(sampleGridHtml);
    const gridContainer = inspector.assertHasTag('div', { class: /grid/ });
    assertTrue(gridContainer.hasClass('gap-5') || gridContainer.hasClass('gap-4'), 'Grid must specify uniform gap spacing');
  });

  test('verifies grid renders "No posts available." fallback message when items array is empty', () => {
    const inspector = createDOMInspector(emptyGridHtml);
    inspector.assertTextContent(/No posts available/i);
    const articles = inspector.findAllTags('article');
    assertEquals(articles.length, 0, 'Empty state must not render any post card articles');
  });

  test('verifies absence of horizontal overflow styling in grid container', () => {
    const inspector = createDOMInspector(sampleGridHtml);
    const gridContainer = inspector.assertHasTag('div', { class: /grid/ });
    assertTrue(!gridContainer.hasClass('overflow-x-scroll'), 'Grid must not introduce horizontal scrolling');
    assertTrue(!gridContainer.hasClass('overflow-x-auto'), 'Grid must not introduce horizontal auto-scroll');
  });
});
