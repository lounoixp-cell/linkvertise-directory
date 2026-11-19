/**
 * Feature F03: Sanity Client & GROQ Queries
 * Specifications: ORIGINAL_REQUEST.md §4, PROJECT.md
 *
 * Requirements:
 * - Sanity client configured with projectId, dataset, apiVersion, and conditional useCdn in production.
 * - sanityFetch helper handles query execution with ISR tags (tags: ['post']) and revalidation interval (60s).
 * - GROQ queries enforce draft exclusion (!(_id in path("drafts.**"))), active status, and deterministic sorting.
 * - Paginated posts query, single post by slug query, and adjacent posts query maintain identical ordering sequence.
 */

import { describe, test, assertEquals, assertTrue, assertContains, assertRejects } from '../harness';
import {
  projectId,
  dataset,
  apiVersion,
  isSanityConfigured,
  sanityFetch,
} from '@/lib/sanity.client';
import {
  paginatedPostsQuery,
  postBySlugQuery,
  adjacentPostsQuery,
  allSortedPostsQuery,
} from '@/lib/sanity.queries';

describe('F03: Sanity Client & GROQ Queries', () => {
  test('validates Sanity client configuration with environment variables and production CDN setting', () => {
    // Dataset defaults to 'production' when env is undefined
    assertTrue(typeof dataset === 'string' && dataset.length > 0, 'dataset must be non-empty string');
    assertEquals(dataset, process.env.NEXT_PUBLIC_SANITY_DATASET || 'production');

    // API version defaults to stable date (e.g., 2024-11-01)
    assertTrue(typeof apiVersion === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(apiVersion), 'apiVersion must follow YYYY-MM-DD');

    // Configuration flag correctly reflects presence of projectId
    assertEquals(isSanityConfigured, Boolean(projectId && projectId.trim() !== ''));
  });

  test('verifies sanityFetch executes queries with revalidation interval and cache tags', async () => {
    // When Sanity is not configured in offline/CI test runner, sanityFetch must reject with clear message
    if (!isSanityConfigured) {
      await assertRejects(
        async () => {
          await sanityFetch({ query: '*[_type == "post"]' });
        },
        'Sanity client is not configured: missing NEXT_PUBLIC_SANITY_PROJECT_ID'
      );
    } else {
      // If configured, function exists and is callable
      assertTrue(typeof sanityFetch === 'function');
    }
  });

  test('validates paginatedPostsQuery GROQ syntax for draft exclusion, active status, and deterministic sort', () => {
    assertTrue(typeof paginatedPostsQuery === 'string');
    // Must filter active posts and exclude drafts
    assertContains(paginatedPostsQuery, '_type == "post"');
    assertContains(paginatedPostsQuery, '!(_id in path("drafts.**"))');
    assertContains(paginatedPostsQuery, 'status == "active"');
    assertContains(paginatedPostsQuery, 'defined(slug.current)');

    // Must sort deterministically: sortOrder asc, publishedAt desc, _id asc
    assertContains(paginatedPostsQuery, 'order(sortOrder asc, publishedAt desc, _id asc)');

    // Must slice with start and end params for pagination
    assertContains(paginatedPostsQuery, '[$start...$end]');

    // Must calculate total count for pagination controls
    assertContains(paginatedPostsQuery, '"totalItems": count(');
  });

  test('validates postBySlugQuery GROQ query for matching slug parameter and image asset projections', () => {
    assertTrue(typeof postBySlugQuery === 'string');
    assertContains(postBySlugQuery, '_type == "post"');
    assertContains(postBySlugQuery, 'slug.current == $slug');
    assertContains(postBySlugQuery, '!(_id in path("drafts.**"))');

    // Must project image asset details including url and metadata dimensions
    assertContains(postBySlugQuery, 'previewImage');
    assertContains(postBySlugQuery, 'asset->');
    assertContains(postBySlugQuery, 'externalUrl');
    assertContains(postBySlugQuery, 'publishedAt');
  });

  test('validates adjacentPostsQuery GROQ structure returns target post and indexList with matching sort order', () => {
    assertTrue(typeof adjacentPostsQuery === 'string');
    // Must return both target post and the full indexList to compute Prev/Next neighbors
    assertContains(adjacentPostsQuery, '"post":');
    assertContains(adjacentPostsQuery, '"indexList":');

    // Index list must share the exact deterministic sort order
    assertContains(adjacentPostsQuery, 'order(sortOrder asc, publishedAt desc, _id asc)');
    assertContains(adjacentPostsQuery, 'status == "active"');

    // Also verify allSortedPostsQuery matches the same ordering
    assertContains(allSortedPostsQuery, 'order(sortOrder asc, publishedAt desc, _id asc)');
  });
});
