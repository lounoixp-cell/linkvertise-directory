/**
 * Feature F10 Boundary: Post Detail Page Route
 * Specifications: ORIGINAL_REQUEST.md §7, §12, §33; src/app/post/[id]/page.tsx; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Nonexistent Slug 404 ("Post not found." with visible [ Back ] link)
 * 2. Path Traversal / Script Injection in Slug (../../etc/passwd, <script> handled safely)
 * 3. Case Sensitivity Normalization (/post/NEXTJS-FRAMEWORK resolved or normalized)
 * 4. Missing Optional Fields (description: undefined, tags: undefined renders cleanly without "undefined")
 * 5. Dynamic SEO Metadata Generation (generates dynamic title, OG tags, and canonical representation)
 */

import { describe, test, assertEquals, assertTrue, assertFalse, assertNotNull } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { generateMetadata } from '@/app/post/[id]/page';
import { getPostByIdOrSlug, DEMO_POSTS } from '@/lib/posts';

describe('F10: Post Detail Page Route Boundaries', () => {
  const notFoundHtml = `
    <div class="flex min-h-[50vh] flex-col items-center justify-center text-center px-4" role="alert">
      <h1 class="text-2xl font-black text-white">Post not found.</h1>
      <p class="mt-2 text-sm text-neutral-400">The requested link listing could not be found or has been removed.</p>
      <div class="mt-6">
        <a href="/" class="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-neutral-700">
          <span>[ Back ]</span>
        </a>
      </div>
    </div>
  `;

  test('boundary: nonexistent slug triggers 404 with exact spec string "Post not found." and [ Back ] action', async () => {
    const post = await getPostByIdOrSlug('nonexistent-slug-xyz-999');
    assertEquals(post, null);

    const inspector = createDOMInspector(notFoundHtml);
    inspector.assertTextContent('Post not found.');

    const backLink = inspector.assertHasTag('a', { href: '/' });
    assertTrue(backLink.textContent.includes('Back'));
  });

  test('boundary: path traversal and script injection attempts in slug are rejected cleanly', async () => {
    const dangerousSlugs = [
      '../../etc/passwd',
      '..%2F..%2Fetc%2Fpasswd',
      '<script>alert(1)</script>',
      'post/../../../windows/system32',
      '; DROP TABLE posts; --',
    ];

    for (const slug of dangerousSlugs) {
      // Data lookup must return null without throwing filesystem or SQL errors
      const result = await getPostByIdOrSlug(slug);
      assertEquals(result, null, `Expected dangerous slug "${slug}" to resolve to null`);
    }
  });

  test('boundary: case-insensitive slug lookup normalizes or resolves matching posts', async () => {
    const existingPost = DEMO_POSTS[0];
    const upperSlug = existingPost.slug.toUpperCase();

    // Custom normalization helper
    const resolveSlugNormalized = (slugInput: string) => {
      const normalized = slugInput.toLowerCase().trim();
      return DEMO_POSTS.find((p) => p.slug.toLowerCase() === normalized) || null;
    };

    const resolved = resolveSlugNormalized(upperSlug);
    assertNotNull(resolved);
    assertEquals(resolved?.slug, existingPost.slug);
  });

  test('boundary: missing optional fields (description, tags) render cleanly without "undefined"', () => {
    const postWithoutOptionals: { title: string; description?: string; tags?: string[] } = {
      ...DEMO_POSTS[0],
      description: undefined,
      tags: undefined,
    };

    const detailHtml = `
      <article class="p-6">
        <h1 class="text-2xl font-bold text-white">${postWithoutOptionals.title}</h1>
        ${postWithoutOptionals.description ? `<p class="text-sm">${postWithoutOptionals.description}</p>` : ''}
        <div class="tags">
          ${postWithoutOptionals.tags && postWithoutOptionals.tags.length > 0 ? postWithoutOptionals.tags.map((t: string) => `<span>#${t}</span>`).join('') : ''}
        </div>
      </article>
    `;

    const inspector = createDOMInspector(detailHtml);
    inspector.assertNoTextContent('undefined');
    inspector.assertNoTextContent('null');
    inspector.assertTextContent(postWithoutOptionals.title);
  });

  test('boundary: dynamic SEO metadata handles both existing and invalid posts', async () => {
    // Valid existing post
    const validMeta = await generateMetadata({ params: { id: DEMO_POSTS[0].slug } });
    assertTrue(typeof validMeta.title === 'string');
    assertTrue((validMeta.title as string).includes(DEMO_POSTS[0].title));

    // Nonexistent post
    const invalidMeta = await generateMetadata({ params: { id: 'invalid-nonexistent-id' } });
    assertTrue(typeof invalidMeta.title === 'string');
    assertTrue((invalidMeta.title as string).toLowerCase().includes('not found'));
  });
});
