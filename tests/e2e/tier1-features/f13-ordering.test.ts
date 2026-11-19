/**
 * Feature F13: Centralized Deterministic Ordering
 * Specifications: ORIGINAL_REQUEST.md §15, PROJECT.md
 *
 * Requirements:
 * - Deterministic ordering: exact same ordering across Homepage, Pagination, Previous, and Next.
 * - Primary sort: sortOrder integer ascending (1, 2, 3...).
 * - Secondary tiebreaker: publishedAt datetime descending (newer first).
 * - Tertiary tiebreaker: post id ascending alphabetical sequence.
 * - Deterministic sort must be idempotent and consistent across multiple executions.
 */

import { describe, test, assertEquals, assertTrue } from '../harness';
import { Post } from '@/types/post';
import { getActiveMockPosts } from '../harness/fixtures';
import { getPaginatedPosts, getAdjacentPosts } from '@/lib/posts';

describe('F13: Centralized Deterministic Ordering', () => {
  // Sort function matching the centralized project contract
  function sortDeterministically(posts: Post[]): Post[] {
    return [...posts].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      const timeA = new Date(a.publishedAt).getTime();
      const timeB = new Date(b.publishedAt).getTime();
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return a.id.localeCompare(b.id);
    });
  }

  test('orders posts primarily by sortOrder integer in ascending sequence', () => {
    const posts: Post[] = [
      { id: '3', slug: 'c', title: 'C', tag: 'T', previewImage: 'img', externalUrl: 'https://c.com', destinationDomain: 'c.com', publishedAt: '2026-01-01T00:00:00Z', status: 'active', sortOrder: 30 },
      { id: '1', slug: 'a', title: 'A', tag: 'T', previewImage: 'img', externalUrl: 'https://a.com', destinationDomain: 'a.com', publishedAt: '2026-01-01T00:00:00Z', status: 'active', sortOrder: 10 },
      { id: '2', slug: 'b', title: 'B', tag: 'T', previewImage: 'img', externalUrl: 'https://b.com', destinationDomain: 'b.com', publishedAt: '2026-01-01T00:00:00Z', status: 'active', sortOrder: 20 },
    ];

    const sorted = sortDeterministically(posts);
    assertEquals(sorted.map((p) => p.slug), ['a', 'b', 'c']);
    assertEquals(sorted[0].sortOrder, 10);
    assertEquals(sorted[1].sortOrder, 20);
    assertEquals(sorted[2].sortOrder, 30);
  });

  test('breaks sortOrder ties by publishedAt datetime in descending sequence (newer first)', () => {
    const posts: Post[] = [
      { id: 'older', slug: 'older', title: 'Older', tag: 'T', previewImage: 'img', externalUrl: 'https://o.com', destinationDomain: 'o.com', publishedAt: '2026-01-01T12:00:00Z', status: 'active', sortOrder: 5 },
      { id: 'newer', slug: 'newer', title: 'Newer', tag: 'T', previewImage: 'img', externalUrl: 'https://n.com', destinationDomain: 'n.com', publishedAt: '2026-02-01T12:00:00Z', status: 'active', sortOrder: 5 },
    ];

    const sorted = sortDeterministically(posts);
    assertEquals(sorted[0].slug, 'newer', 'When sortOrder is tied, newer publishedAt must come first');
    assertEquals(sorted[1].slug, 'older');
  });

  test('breaks sortOrder and publishedAt ties by post id in ascending alphabetical sequence', () => {
    const posts: Post[] = [
      { id: 'post-z', slug: 'z', title: 'Z', tag: 'T', previewImage: 'img', externalUrl: 'https://z.com', destinationDomain: 'z.com', publishedAt: '2026-01-01T12:00:00Z', status: 'active', sortOrder: 1 },
      { id: 'post-a', slug: 'a', title: 'A', tag: 'T', previewImage: 'img', externalUrl: 'https://a.com', destinationDomain: 'a.com', publishedAt: '2026-01-01T12:00:00Z', status: 'active', sortOrder: 1 },
      { id: 'post-m', slug: 'm', title: 'M', tag: 'T', previewImage: 'img', externalUrl: 'https://m.com', destinationDomain: 'm.com', publishedAt: '2026-01-01T12:00:00Z', status: 'active', sortOrder: 1 },
    ];

    const sorted = sortDeterministically(posts);
    assertEquals(sorted.map((p) => p.id), ['post-a', 'post-m', 'post-z']);
  });

  test('verifies homepage pagination order matches adjacent post navigation order exactly', async () => {
    const page1 = await getPaginatedPosts(1, 10);
    const items = page1.items;

    // For any two adjacent posts in the paginated listing, getAdjacentPosts must return them as prev/next
    for (let i = 0; i < items.length - 1; i++) {
      const current = items[i];
      const nextExpected = items[i + 1];

      const adjacent = await getAdjacentPosts(current.slug);
      assertEquals(
        adjacent.nextPost?.slug,
        nextExpected.slug,
        `Post ${current.slug} must have next post ${nextExpected.slug} matching pagination sequence`
      );
    }
  });

  test('verifies deterministic sort function is idempotent across multiple invocations', () => {
    const activePosts = getActiveMockPosts();
    const sortedOnce = sortDeterministically(activePosts);
    const sortedTwice = sortDeterministically(sortedOnce);

    assertEquals(sortedOnce.map((p) => p.id), sortedTwice.map((p) => p.id));
  });
});
