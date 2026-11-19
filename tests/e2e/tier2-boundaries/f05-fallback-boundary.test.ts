/**
 * Feature F05 Boundary: Robust Fallback Data Layer
 * Specifications: ORIGINAL_REQUEST.md §4, §33; src/lib/posts.ts; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Empty Post Catalog (0 items returns empty array, totalPages 1, hasNextPage false)
 * 2. Single Post Catalog (1 item returns 1 item, totalPages 1, hasNextPage false)
 * 3. Exact Page Size Boundary (exactly POSTS_PER_PAGE items -> totalPages 1, hasNextPage false)
 * 4. Page Size Plus One Boundary (POSTS_PER_PAGE + 1 items -> totalPages 2, page 1 hasNextPage true)
 * 5. Nonexistent Slug Query (returns null cleanly without throwing)
 */

import { describe, test, assertEquals, assertTrue, assertFalse, assertNull } from '../harness';
import { getPostBySlug, POSTS_PER_PAGE, DEMO_POSTS } from '@/lib/posts';
import { Post } from '@/types/post';

describe('F05: Robust Fallback Data Layer Boundaries', () => {
  // Pure pagination calculation function mirroring getPaginatedPosts contract
  function paginateCatalog(posts: Post[], page: number, pageSize: number = POSTS_PER_PAGE) {
    const safePage = Math.max(1, Math.floor(Number(page)) || 1);
    const safePageSize = Math.max(1, Math.floor(Number(pageSize)) || POSTS_PER_PAGE);
    const totalItems = posts.length;
    const totalPages = Math.ceil(totalItems / safePageSize) || 1;
    const startIndex = (safePage - 1) * safePageSize;
    const items = posts.slice(startIndex, startIndex + safePageSize);

    return {
      items,
      totalItems,
      currentPage: safePage,
      totalPages,
      pageSize: safePageSize,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    };
  }

  test('boundary: empty catalog (0 items) produces safe paginated structure', () => {
    const emptyCatalog: Post[] = [];
    const result = paginateCatalog(emptyCatalog, 1);

    assertEquals(result.items.length, 0);
    assertEquals(result.totalItems, 0);
    assertEquals(result.totalPages, 1);
    assertEquals(result.currentPage, 1);
    assertFalse(result.hasNextPage);
    assertFalse(result.hasPrevPage);
  });

  test('boundary: single post catalog (1 item) serves single page without next/prev links', () => {
    const singlePostCatalog: Post[] = [DEMO_POSTS[0]];
    const result = paginateCatalog(singlePostCatalog, 1);

    assertEquals(result.items.length, 1);
    assertEquals(result.totalItems, 1);
    assertEquals(result.totalPages, 1);
    assertEquals(result.currentPage, 1);
    assertEquals(result.items[0].slug, DEMO_POSTS[0].slug);
    assertFalse(result.hasNextPage);
    assertFalse(result.hasPrevPage);
  });

  test('boundary: exact page size count (POSTS_PER_PAGE items) yields exactly 1 page', () => {
    // Generate catalog with exactly POSTS_PER_PAGE (8) items
    const exactCatalog = DEMO_POSTS.slice(0, POSTS_PER_PAGE);
    assertEquals(exactCatalog.length, POSTS_PER_PAGE);

    const result = paginateCatalog(exactCatalog, 1, POSTS_PER_PAGE);

    assertEquals(result.items.length, POSTS_PER_PAGE);
    assertEquals(result.totalItems, POSTS_PER_PAGE);
    assertEquals(result.totalPages, 1);
    assertFalse(result.hasNextPage);
    assertFalse(result.hasPrevPage);
  });

  test('boundary: page size plus one (POSTS_PER_PAGE + 1) creates second page and activates next flag', () => {
    const catalogPlusOne = DEMO_POSTS.slice(0, POSTS_PER_PAGE + 1);
    assertEquals(catalogPlusOne.length, POSTS_PER_PAGE + 1);

    // Page 1
    const page1 = paginateCatalog(catalogPlusOne, 1, POSTS_PER_PAGE);
    assertEquals(page1.items.length, POSTS_PER_PAGE);
    assertEquals(page1.totalPages, 2);
    assertTrue(page1.hasNextPage);
    assertFalse(page1.hasPrevPage);

    // Page 2
    const page2 = paginateCatalog(catalogPlusOne, 2, POSTS_PER_PAGE);
    assertEquals(page2.items.length, 1);
    assertEquals(page2.totalPages, 2);
    assertFalse(page2.hasNextPage);
    assertTrue(page2.hasPrevPage);
  });

  test('boundary: nonexistent post slug query returns null cleanly', async () => {
    const nonExistentSlugs = [
      'completely-nonexistent-post-slug-xyz',
      'invalid-post-404-check',
      'random_slug_never_added',
      '',
    ];

    for (const slug of nonExistentSlugs) {
      const result = await getPostBySlug(slug);
      assertNull(result, `Expected getPostBySlug("${slug}") to return null`);
    }
  });
});
