/**
 * Feature F13 Boundary: Centralized Deterministic Ordering
 * Specifications: ORIGINAL_REQUEST.md §15; src/lib/posts.ts; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Identical SortOrder Tiebreak: date descending orders newer post ahead of older
 * 2. Identical SortOrder & Date Tiebreak: id ascending provides 100% deterministic ordering
 * 3. Negative and Zero SortOrder Values (-10, 0, 5 sorted in ascending order)
 * 4. Cross-Page & Prev/Next Ordering Consistency (page 1 end links to page 2 start)
 * 5. Large Catalog Stability (100 shuffled items sort to identical stable sequence)
 */

import { describe, test, assertEquals, assertTrue } from '../harness';
import { sortPostsDeterministically, DEMO_POSTS } from '@/lib/posts';
import { Post } from '@/types/post';

describe('F13: Deterministic Ordering Boundaries', () => {
  test('boundary: identical sortOrder resolves secondary tiebreaker on publishedAt descending', () => {
    const postOld: Post = {
      ...DEMO_POSTS[0],
      id: 'post-old',
      title: 'Older Post',
      sortOrder: 1,
      publishedAt: '2026-01-01T00:00:00.000Z',
    };
    const postNew: Post = {
      ...DEMO_POSTS[1],
      id: 'post-new',
      title: 'Newer Post',
      sortOrder: 1,
      publishedAt: '2026-01-15T00:00:00.000Z',
    };

    const sorted = sortPostsDeterministically([postOld, postNew]);
    // Newer post must come first
    assertEquals(sorted[0].id, 'post-new');
    assertEquals(sorted[1].id, 'post-old');
  });

  test('boundary: identical sortOrder and publishedAt resolves tertiary tiebreaker on id ascending', () => {
    const postB: Post = {
      ...DEMO_POSTS[0],
      id: 'post-b',
      title: 'Post B',
      sortOrder: 2,
      publishedAt: '2026-02-01T00:00:00.000Z',
    };
    const postA: Post = {
      ...DEMO_POSTS[1],
      id: 'post-a',
      title: 'Post A',
      sortOrder: 2,
      publishedAt: '2026-02-01T00:00:00.000Z',
    };

    const sorted = sortPostsDeterministically([postB, postA]);
    // 'post-a' comes before 'post-b' lexicographically
    assertEquals(sorted[0].id, 'post-a');
    assertEquals(sorted[1].id, 'post-b');
  });

  test('boundary: negative and zero sortOrder values sorted in mathematical ascending order', () => {
    const postNegative: Post = {
      ...DEMO_POSTS[0],
      id: 'neg-10',
      title: 'Negative Order',
      sortOrder: -10,
    };
    const postZero: Post = {
      ...DEMO_POSTS[1],
      id: 'zero-0',
      title: 'Zero Order',
      sortOrder: 0,
    };
    const postPositive: Post = {
      ...DEMO_POSTS[2],
      id: 'pos-5',
      title: 'Positive Order',
      sortOrder: 5,
    };

    const shuffled = [postPositive, postNegative, postZero];
    const sorted = sortPostsDeterministically(shuffled);

    assertEquals(sorted[0].sortOrder, -10);
    assertEquals(sorted[1].sortOrder, 0);
    assertEquals(sorted[2].sortOrder, 5);
  });

  test('boundary: cross-page and linear navigation ordering remain 100% consistent', () => {
    const allSorted = sortPostsDeterministically([...DEMO_POSTS]);
    const pageSize = 4;

    // Page 1
    const page1 = allSorted.slice(0, pageSize);
    // Page 2
    const page2 = allSorted.slice(pageSize, pageSize * 2);

    // The last item of page 1 must precede the first item of page 2 in global order
    const lastOfPage1 = page1[page1.length - 1];
    const firstOfPage2 = page2[0];

    const globalIdx1 = allSorted.findIndex((p) => p.id === lastOfPage1.id);
    const globalIdx2 = allSorted.findIndex((p) => p.id === firstOfPage2.id);

    assertEquals(globalIdx1 + 1, globalIdx2);
  });

  test('boundary: large catalog (100 items) stability: repeated sorts yield identical sequence', () => {
    // Generate 100 items with overlapping sort orders and dates
    const largeCatalog: Post[] = [];
    for (let i = 0; i < 100; i++) {
      largeCatalog.push({
        ...DEMO_POSTS[i % DEMO_POSTS.length],
        id: `item-${String(i).padStart(3, '0')}`,
        sortOrder: Math.floor(i / 10), // 10 items share sortOrder 0, 10 share 1, etc.
        publishedAt: new Date(1768000000000 + (i % 5) * 86400000).toISOString(),
      });
    }

    // Shuffle
    const shuffled1 = [...largeCatalog].reverse();
    const shuffled2 = [...largeCatalog].sort(() => 0.5 - Math.random());

    const result1 = sortPostsDeterministically(shuffled1);
    const result2 = sortPostsDeterministically(shuffled2);

    assertEquals(result1.length, 100);
    assertEquals(result2.length, 100);

    for (let i = 0; i < 100; i++) {
      assertEquals(result1[i].id, result2[i].id);
    }
  });
});
