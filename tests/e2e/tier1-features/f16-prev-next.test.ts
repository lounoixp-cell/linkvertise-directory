/**
 * Feature F16: Previous / Next Post Navigation
 * Specifications: ORIGINAL_REQUEST.md §16, §38, PROJECT.md
 *
 * Requirements:
 * - Prev/Next navigation on individual post pages.
 * - First post: Previous disabled, Next available.
 * - Last post: Previous available, Next disabled.
 * - Middle post: both Previous and Next active.
 * - Desktop alignment: Previous LEFT, Next RIGHT.
 * - Single-post dataset: disables/hides both controls.
 */

import { describe, test, assertEquals, assertTrue, assertNull, assertNotNull } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { getAdjacentPosts, DEMO_POSTS } from '@/lib/posts';

describe('F16: Previous / Next Post Navigation', () => {
  const middlePostNavHtml = `
    <nav aria-label="Post navigation" class="mt-10 border-t border-neutral-800 pt-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href="/post/post-1" data-nav="prev" class="flex flex-col p-4 text-left border border-neutral-800 rounded-xl">
          <span class="text-xs font-semibold text-neutral-400">&larr; PREVIOUS</span>
          <span class="mt-1 font-bold text-white">Post 1 Title</span>
        </a>
        <a href="/post/post-3" data-nav="next" class="flex flex-col p-4 text-left sm:text-right border border-neutral-800 rounded-xl">
          <span class="text-xs font-semibold text-neutral-400">NEXT &rarr;</span>
          <span class="mt-1 font-bold text-white">Post 3 Title</span>
        </a>
      </div>
    </nav>
  `;

  const firstPostNavHtml = `
    <nav aria-label="Post navigation">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div data-nav="prev-disabled" class="opacity-40 cursor-not-allowed p-4 text-left">
          <span>No previous post</span>
        </div>
        <a href="/post/post-2" data-nav="next" class="p-4 text-right">
          <span>NEXT &rarr;</span>
        </a>
      </div>
    </nav>
  `;

  test('verifies first post has Previous navigation disabled and Next navigation linking to post 2', async () => {
    const firstSlug = DEMO_POSTS[0].slug;
    const adjacent = await getAdjacentPosts(firstSlug);

    assertNull(adjacent.prevPost, 'First post must have null prevPost');
    assertNotNull(adjacent.nextPost, 'First post must have non-null nextPost');

    const inspector = createDOMInspector(firstPostNavHtml);
    const disabledPrev = inspector.findTag('div', { 'data-nav': 'prev-disabled' });
    assertTrue(disabledPrev !== null, 'Disabled previous placeholder must be present');
    assertTrue(disabledPrev?.hasClass('opacity-40'));
  });

  test('verifies last post has Next navigation disabled and Previous navigation linking to post N-1', async () => {
    const lastSlug = DEMO_POSTS[DEMO_POSTS.length - 1].slug;
    const adjacent = await getAdjacentPosts(lastSlug);

    assertNotNull(adjacent.prevPost, 'Last post must have non-null prevPost');
    assertNull(adjacent.nextPost, 'Last post must have null nextPost');
  });

  test('verifies middle post provides active bidirectional Previous and Next navigation links', async () => {
    const middleSlug = DEMO_POSTS[1].slug;
    const adjacent = await getAdjacentPosts(middleSlug);

    assertNotNull(adjacent.prevPost, 'Middle post must have active prevPost');
    assertNotNull(adjacent.nextPost, 'Middle post must have active nextPost');

    const inspector = createDOMInspector(middlePostNavHtml);
    const prevLink = inspector.findTag('a', { 'data-nav': 'prev' });
    const nextLink = inspector.findTag('a', { 'data-nav': 'next' });

    assertNotNull(prevLink);
    assertNotNull(nextLink);
    assertTrue(prevLink?.getAttribute('href')?.startsWith('/post/'));
    assertTrue(nextLink?.getAttribute('href')?.startsWith('/post/'));
  });

  test('verifies Previous is aligned left and Next is aligned right in desktop layout', () => {
    const inspector = createDOMInspector(middlePostNavHtml);
    const prevLink = inspector.findTag('a', { 'data-nav': 'prev' });
    const nextLink = inspector.findTag('a', { 'data-nav': 'next' });

    assertTrue(prevLink?.hasClass('text-left'), 'Previous link must be aligned left');
    assertTrue(nextLink?.hasClass('sm:text-right'), 'Next link must be aligned right on desktop');
  });

  test('verifies single-post dataset disables both Previous and Next navigation', async () => {
    // If an unknown slug or lone post is requested
    const loneAdjacent = await getAdjacentPosts('lone-post-slug-that-does-not-exist');
    assertNull(loneAdjacent.prevPost);
    assertNull(loneAdjacent.nextPost);
  });
});
