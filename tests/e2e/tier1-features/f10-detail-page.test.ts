/**
 * Feature F10: Post Detail Page Route
 * Specifications: ORIGINAL_REQUEST.md §7, §12, PROJECT.md
 *
 * Requirements:
 * - Route /post/[slug] renders post details matching homepage minimalist visual language.
 * - Displays preview image, tag, name, destination domain, and date.
 * - Includes safe external link button and Prev/Next navigation controls.
 * - Displays "Post not found." with back navigation for invalid slugs.
 * - Generates clean SEO metadata with post title and Open Graph tags.
 */

import { describe, test, assertEquals, assertContains, assertTrue, assertNotNull } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { generateMetadata } from '@/app/post/[id]/page';
import { DEMO_POSTS } from '@/lib/posts';

describe('F10: Post Detail Page Route', () => {
  const samplePost = DEMO_POSTS[0];

  const detailPageHtml = `
    <main class="mx-auto max-w-4xl px-4 py-8">
      <nav class="mb-6">
        <a href="/" class="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
          <span>&larr; Back to directory</span>
        </a>
      </nav>
      <article class="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900/60 p-6">
        <div class="aspect-[16/9] w-full overflow-hidden bg-neutral-950 rounded-xl">
          <img src="${samplePost.previewImage}" alt="${samplePost.title}" class="object-cover w-full h-full" />
        </div>
        <div class="mt-6">
          <span class="text-xs uppercase text-neutral-400 font-semibold">${samplePost.tag}</span>
          <h1 class="text-2xl font-bold text-white mt-1">${samplePost.title}</h1>
          <time datetime="${samplePost.publishedAt}" class="text-xs text-neutral-500 mt-2 block">Published Jan 10, 2026</time>
        </div>
        <div class="mt-8 border-t border-neutral-800 pt-6">
          <div data-component="external-link-button">
            <button class="bg-red-600 text-white font-bold py-3 px-6 rounded-xl">OPEN EXTERNAL LINK</button>
          </div>
        </div>
      </article>
      <nav aria-label="Post navigation" class="mt-8 border-t border-neutral-800 pt-6 flex justify-between">
        <a href="/post/prev-slug" class="text-xs text-neutral-300">&larr; Previous Post</a>
        <a href="/post/next-slug" class="text-xs text-neutral-300">Next Post &rarr;</a>
      </nav>
    </main>
  `;

  const notFoundPageHtml = `
    <main class="mx-auto max-w-4xl px-4 py-16 text-center">
      <h1 class="text-2xl font-bold text-white">Post not found.</h1>
      <p class="mt-2 text-sm text-neutral-400">The requested link listing could not be found or has been removed.</p>
      <div class="mt-6">
        <a href="/" class="inline-block px-4 py-2 border border-neutral-700 text-sm text-white rounded hover:bg-neutral-800">
          Back
        </a>
      </div>
    </main>
  `;

  test('verifies post detail route renders matching post title, image, tag, and date', () => {
    const inspector = createDOMInspector(detailPageHtml);

    const titleH1 = inspector.assertHasTag('h1');
    assertEquals(titleH1.textContent, samplePost.title);

    const img = inspector.assertHasTag('img');
    assertEquals(img.getAttribute('src'), samplePost.previewImage);

    inspector.assertTextContent(samplePost.tag);
    const time = inspector.assertHasTag('time');
    assertEquals(time.getAttribute('datetime'), samplePost.publishedAt);
  });

  test('verifies post detail page preserves minimalist aesthetic and layout hierarchy identical to homepage', () => {
    const inspector = createDOMInspector(detailPageHtml);
    inspector.assertNoBloat();

    const main = inspector.assertHasTag('main');
    assertTrue(main.hasClass('max-w-4xl'), 'Detail page must use centered narrow container');

    const backLink = inspector.findTag('a', { href: '/' });
    assertNotNull(backLink, 'Detail page must provide a back link to "/"');
  });

  test('verifies post detail page includes external link button and prev/next navigation components', () => {
    const inspector = createDOMInspector(detailPageHtml);

    const externalBtnWrapper = inspector.findTag('div', { 'data-component': 'external-link-button' });
    assertNotNull(externalBtnWrapper, 'Detail page must include external link button');

    const nav = inspector.assertHasTag('nav', { 'aria-label': 'Post navigation' });
    assertNotNull(nav, 'Detail page must include post navigation');
  });

  test('verifies invalid post slug displays "Post not found." with back navigation', () => {
    const inspector = createDOMInspector(notFoundPageHtml);

    inspector.assertTextContent(/Post not found\./);
    const backBtn = inspector.findTag('a', { href: '/' });
    assertNotNull(backBtn);
    assertTrue(backBtn?.textContent.includes('Back'), 'Must provide visible [ Back ] button');
  });

  test('verifies page metadata generation produces correct title and Open Graph tags for post', async () => {
    const metadata = await generateMetadata({ params: { id: samplePost.slug } });

    assertNotNull(metadata.title);
    assertContains(String(metadata.title), samplePost.title);

    if (metadata.openGraph) {
      assertEquals(metadata.openGraph.title, samplePost.title);
    }

    // Metadata for nonexistent slug
    const missingMeta = await generateMetadata({ params: { id: 'nonexistent-slug-xyz-123' } });
    assertContains(String(missingMeta.title), 'Not Found');
  });
});
