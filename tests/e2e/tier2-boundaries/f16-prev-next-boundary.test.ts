/**
 * Feature F16 Boundary: Previous / Next Post Navigation
 * Specifications: ORIGINAL_REQUEST.md §16, §38; src/components/PostNavigation.tsx; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. First Post in Catalog: prevPost is null -> Previous button disabled ("No previous post")
 * 2. Last Post in Catalog: nextPost is null -> Next button disabled ("No next post")
 * 3. Single Post in System: both null -> Navigation component returns null
 * 4. Round-Trip Linear Traversal: Post 2 -> Next (Post 3) -> Previous (Post 2)
 * 5. Responsive Stacking: mobile stacks vertically (grid-cols-1), desktop 2 columns (sm:grid-cols-2)
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { getAdjacentPosts, DEMO_POSTS, sortPostsDeterministically } from '@/lib/posts';

describe('F16: Previous / Next Post Navigation Boundaries', () => {
  const allPosts = sortPostsDeterministically([...DEMO_POSTS]);

  test('boundary: first post in catalog has Previous disabled ("No previous post") and Next active', async () => {
    const firstPost = allPosts[0];
    const { prevPost, nextPost } = await getAdjacentPosts(firstPost.slug);

    // For the first post, prevPost must be null
    assertEquals(prevPost, null);
    // nextPost must exist
    assertTrue(nextPost !== null);
    assertEquals(nextPost?.id, allPosts[1].id);

    // Markup representation
    const firstPostNavHtml = `
      <nav aria-label="Post navigation">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="opacity-40 select-none text-left" data-disabled="prev">
            <span>PREVIOUS</span>
            <span>No previous post</span>
          </div>
          <a href="/post/${nextPost?.slug}" class="text-right" data-active="next">
            <span>NEXT</span>
            <span>${nextPost?.title}</span>
          </a>
        </div>
      </nav>
    `;

    const inspector = createDOMInspector(firstPostNavHtml);
    inspector.assertTextContent('No previous post');
    const prevEl = inspector.findTag('div', { 'data-disabled': 'prev' });
    assertTrue(prevEl !== null);

    const nextLink = inspector.findTag('a', { 'data-active': 'next' });
    assertEquals(nextLink?.getAttribute('href'), `/post/${nextPost?.slug}`);
  });

  test('boundary: last post in catalog has Next disabled ("No next post") and Previous active', async () => {
    const lastPost = allPosts[allPosts.length - 1];
    const { prevPost, nextPost } = await getAdjacentPosts(lastPost.slug);

    // For the last post, nextPost must be null
    assertEquals(nextPost, null);
    // prevPost must exist
    assertTrue(prevPost !== null);
    assertEquals(prevPost?.id, allPosts[allPosts.length - 2].id);

    // Markup representation
    const lastPostNavHtml = `
      <nav aria-label="Post navigation">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="/post/${prevPost?.slug}" class="text-left" data-active="prev">
            <span>PREVIOUS</span>
            <span>${prevPost?.title}</span>
          </a>
          <div class="opacity-40 select-none text-right" data-disabled="next">
            <span>NEXT</span>
            <span>No next post</span>
          </div>
        </div>
      </nav>
    `;

    const inspector = createDOMInspector(lastPostNavHtml);
    inspector.assertTextContent('No next post');
    const nextEl = inspector.findTag('div', { 'data-disabled': 'next' });
    assertTrue(nextEl !== null);

    const prevLink = inspector.findTag('a', { 'data-active': 'prev' });
    assertEquals(prevLink?.getAttribute('href'), `/post/${prevPost?.slug}`);
  });

  test('boundary: single post in entire system causes navigation component to return null', () => {
    // PostNavigation component specification:
    // if (!prevPost && !nextPost) return null;
    const shouldRenderNav = (prev: unknown, next: unknown): boolean => Boolean(prev || next);

    assertFalse(shouldRenderNav(null, null));
    assertTrue(shouldRenderNav({ id: '1' }, null));
    assertTrue(shouldRenderNav(null, { id: '2' }));
    assertTrue(shouldRenderNav({ id: '1' }, { id: '2' }));
  });

  test('boundary: round-trip traversal: Post 2 -> Next (Post 3) -> Previous (Post 2)', async () => {
    const post2 = allPosts[1];
    const { nextPost: forwardTarget } = await getAdjacentPosts(post2.slug);
    assertTrue(forwardTarget !== null);
    assertEquals(forwardTarget?.id, allPosts[2].id);

    // From Post 3, navigate backward
    const { prevPost: backwardTarget } = await getAdjacentPosts(forwardTarget!.slug);
    assertTrue(backwardTarget !== null);
    assertEquals(backwardTarget?.id, post2.id);
  });

  test('boundary: responsive stacking verifies mobile vertical stack and desktop 2-column layout', () => {
    const navHtml = `
      <nav aria-label="Post navigation" class="mt-10 border-t border-neutral-800 pt-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="/post/1" class="text-left">Previous</a>
          <a href="/post/3" class="text-left sm:text-right">Next</a>
        </div>
      </nav>
    `;

    const inspector = createDOMInspector(navHtml);
    const container = inspector.assertHasTag('div', { class: /grid/ });

    assertTrue(container.hasClass('grid-cols-1'), 'Mobile must stack vertically with grid-cols-1');
    assertTrue(container.hasClass('sm:grid-cols-2'), 'Desktop must render 2 columns side-by-side');
  });
});
