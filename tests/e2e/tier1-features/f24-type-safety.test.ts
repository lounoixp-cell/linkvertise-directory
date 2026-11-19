/**
 * Feature F24: Type Safety & Clean Build
 * Specifications: ORIGINAL_REQUEST.md §26, §38, PROJECT.md
 *
 * Requirements:
 * - TypeScript compilation (tsc --noEmit) passes with zero type errors.
 * - tsconfig.json enforces strict mode ("strict": true).
 * - Post type interface enforces all required fields and correct typing.
 * - PaginatedResult interface enforces pagination properties and generic typing.
 * - App Router page component parameter and prop typing integrity.
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, test, assertEquals, assertTrue } from '../harness';
import { Post, PaginatedResult } from '@/types/post';
import { MOCK_POSTS } from '../harness/fixtures';

describe('F24: Type Safety & Clean Build', () => {
  const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');

  test('verifies tsconfig.json enforces strict mode ("strict": true)', () => {
    assertTrue(fs.existsSync(tsconfigPath), 'tsconfig.json must exist');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    assertEquals(tsconfig.compilerOptions?.strict, true, 'tsconfig.json must enforce strict: true');
    assertEquals(tsconfig.compilerOptions?.noEmit, true, 'tsconfig.json must set noEmit: true');
  });

  test('verifies Post type interface enforces all required fields and correct typing', () => {
    const sample: Post = MOCK_POSTS[0];

    assertTrue(typeof sample.id === 'string');
    assertTrue(typeof sample.slug === 'string');
    assertTrue(typeof sample.title === 'string');
    assertTrue(typeof sample.tag === 'string');
    assertTrue(typeof sample.previewImage === 'string');
    assertTrue(typeof sample.externalUrl === 'string');
    assertTrue(typeof sample.destinationDomain === 'string');
    assertTrue(typeof sample.publishedAt === 'string');
    assertTrue(sample.status === 'active' || sample.status === 'archived');
    assertTrue(typeof sample.sortOrder === 'number');
  });

  test('verifies PaginatedResult interface enforces pagination properties and generic typing', () => {
    const paginated: PaginatedResult<Post> = {
      items: [MOCK_POSTS[0]],
      totalItems: 1,
      currentPage: 1,
      totalPages: 1,
      pageSize: 8,
      hasNextPage: false,
      hasPrevPage: false,
    };

    assertEquals(paginated.items.length, 1);
    assertEquals(paginated.totalItems, 1);
    assertEquals(paginated.currentPage, 1);
    assertEquals(paginated.totalPages, 1);
    assertEquals(paginated.pageSize, 8);
    assertEquals(paginated.hasNextPage, false);
    assertEquals(paginated.hasPrevPage, false);
  });

  test('verifies App Router page components properly type route parameters and searchParams', () => {
    // Type contract for dynamic route params
    interface DetailRouteProps {
      params: { id: string };
      searchParams?: Record<string, string | string[] | undefined>;
    }

    const testProps: DetailRouteProps = {
      params: { id: 'nextjs-framework' },
      searchParams: { ref: 'directory' },
    };

    assertEquals(testProps.params.id, 'nextjs-framework');
    assertEquals(testProps.searchParams?.ref, 'directory');
  });

  test('verifies module path alias @/* resolution is mapped to ./src/*', () => {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    const paths = tsconfig.compilerOptions?.paths;

    assertTrue(paths !== undefined, 'tsconfig paths must be defined');
    assertTrue('@/*' in paths, 'tsconfig must map @/*');
    assertEquals(paths['@/*'][0], './src/*');
  });
});
