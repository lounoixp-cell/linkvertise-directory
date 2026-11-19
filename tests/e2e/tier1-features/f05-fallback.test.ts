/**
 * Feature F05: Robust Fallback Data Layer
 * Specifications: ORIGINAL_REQUEST.md §4, §33, PROJECT.md
 *
 * Requirements:
 * - Unified post repository with DEMO_POSTS fallback.
 * - Builds succeed locally & in CI without requiring active Sanity credentials.
 * - DEMO_POSTS items strictly adhere to Post entity schema.
 * - getPaginatedPosts computes pagination slices and flags correctly.
 * - getPostBySlug returns matched post or null for missing slug.
 * - getAdjacentPosts calculates Prev/Next neighbors deterministically.
 */

import { describe, test, assertEquals, assertNotEquals, assertTrue, assertNull, assertNotNull } from '../harness';
import {
  DEMO_POSTS,
  getPaginatedPosts,
  getPostBySlug,
  getAdjacentPosts,
  POSTS_PER_PAGE,
} from '@/lib/posts';

describe('F05: Robust Fallback Data Layer', () => {
  test('falls back gracefully to DEMO_POSTS when Sanity is not configured without throwing', async () => {
    // Should successfully resolve paginated result without throwing
    const result = await getPaginatedPosts(1, 8);
    assertNotNull(result);
    assertTrue(Array.isArray(result.items));
    assertTrue(result.items.length > 0);
    assertTrue(result.totalItems >= result.items.length);
  });

  test('verifies all DEMO_POSTS satisfy the Post entity interface contract', () => {
    assertTrue(DEMO_POSTS.length >= 10, 'Expected at least 10 demo posts');

    for (const post of DEMO_POSTS) {
      assertTrue(typeof post.id === 'string' && post.id.length > 0, 'id must be non-empty string');
      assertTrue(typeof post.slug === 'string' && post.slug.length > 0, 'slug must be non-empty string');
      assertTrue(typeof post.title === 'string' && post.title.length > 0, 'title must be non-empty string');
      assertTrue(typeof post.tag === 'string' && post.tag.length > 0, 'tag must be non-empty string');
      assertTrue(typeof post.previewImage === 'string' && post.previewImage.startsWith('http'), 'previewImage must be valid URL');
      assertTrue(typeof post.externalUrl === 'string' && post.externalUrl.startsWith('https://'), 'externalUrl must be https URL');
      assertTrue(typeof post.destinationDomain === 'string' && post.destinationDomain.length > 0, 'destinationDomain required');
      assertTrue(!Number.isNaN(Date.parse(post.publishedAt)), 'publishedAt must be valid ISO date string');
      assertTrue(post.status === 'active' || post.status === 'archived', 'status must be active or archived');
      assertTrue(typeof post.sortOrder === 'number', 'sortOrder must be integer');
    }
  });

  test('verifies getPaginatedPosts computes correct page slicing and totalPages using fallback data', async () => {
    const pageSize = 4;
    const page1 = await getPaginatedPosts(1, pageSize);
    assertEquals(page1.currentPage, 1);
    assertEquals(page1.pageSize, pageSize);
    assertEquals(page1.items.length, pageSize);
    assertEquals(page1.hasPrevPage, false);
    assertEquals(page1.hasNextPage, true);

    const expectedTotalPages = Math.ceil(page1.totalItems / pageSize);
    assertEquals(page1.totalPages, expectedTotalPages);

    // Page 2 must have distinct items
    const page2 = await getPaginatedPosts(2, pageSize);
    assertEquals(page2.currentPage, 2);
    assertEquals(page2.hasPrevPage, true);
    assertNotEquals(page1.items[0].id, page2.items[0].id);
  });

  test('verifies getPostBySlug retrieves correct post from fallback data and returns null for unknown slug', async () => {
    const targetSlug = DEMO_POSTS[0].slug;
    const found = await getPostBySlug(targetSlug);
    assertNotNull(found);
    assertEquals(found?.slug, targetSlug);
    assertEquals(found?.title, DEMO_POSTS[0].title);

    // Unknown slug returns null
    const notFound = await getPostBySlug('nonexistent-slug-xyz-999');
    assertNull(notFound);
  });

  test('verifies getAdjacentPosts calculates correct previous and next posts from fallback data', async () => {
    // Elena Frost is item 2, with Serena Noir (item 1) as prev and Aurora Blake (item 3) as next
    const middleSlug = 'elena-frost-cyberpunk-cosplay';
    const adjacent = await getAdjacentPosts(middleSlug);

    assertNotNull(adjacent.prevPost, 'Middle post must have prevPost');
    assertNotNull(adjacent.nextPost, 'Middle post must have nextPost');
    assertEquals(adjacent.prevPost?.slug, 'serena-noir-exclusive-gallery');
    assertEquals(adjacent.nextPost?.slug, 'aurora-blake-sunset-beachside');

    // First post has no prevPost
    const firstAdj = await getAdjacentPosts('serena-noir-exclusive-gallery');
    assertNull(firstAdj.prevPost, 'First post must have null prevPost');
    assertNotNull(firstAdj.nextPost, 'First post must have nextPost');
  });
});
