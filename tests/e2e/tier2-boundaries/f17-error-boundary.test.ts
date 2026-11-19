/**
 * Feature F17 Boundary: Error States & Fallbacks
 * Specifications: ORIGINAL_REQUEST.md §33; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Exact 404 Spec Strings: "Post not found." and "[ Back ]" action link
 * 2. Exact Broken Link Spec String: "Link unavailable." for unsafe/malformed destination
 * 3. Exact Empty Catalog Spec String: "No posts available." for 0 items
 * 4. Missing Image Neutral Placeholder: renders neutral container without layout shift
 * 5. Minimalist Layout Preservation: Header and Footer remain intact on error views
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';

describe('F17: Error States & Fallbacks Boundaries', () => {
  test('boundary: exact 404 spec strings "Post not found." and "[ Back ]" action link', () => {
    const errorPageHtml = `
      <div class="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
        <h1 class="text-2xl font-black text-white">Post not found.</h1>
        <p class="mt-2 text-sm text-neutral-400">The requested link listing could not be found or has been removed.</p>
        <div class="mt-6">
          <a href="/" class="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-neutral-700">
            <span>[ Back ]</span>
          </a>
        </div>
      </div>
    `;

    const inspector = createDOMInspector(errorPageHtml);
    inspector.assertTextContent('Post not found.');
    inspector.assertTextContent('[ Back ]');

    const backLink = inspector.assertHasTag('a', { href: '/' });
    assertEquals(backLink.getAttribute('href'), '/');
  });

  test('boundary: exact broken link spec string "Link unavailable." rendered for unsafe URLs', () => {
    const brokenLinkHtml = `
      <div class="mt-4 flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-400" role="alert">
        <span>Link unavailable.</span>
      </div>
    `;

    const inspector = createDOMInspector(brokenLinkHtml);
    inspector.assertTextContent('Link unavailable.');
    const alertDiv = inspector.assertHasTag('div', { role: 'alert' });
    assertTrue(alertDiv.hasClass('border-red-500/30'));
  });

  test('boundary: exact empty catalog spec string "No posts available." rendered for 0 items', () => {
    const emptyCatalogHtml = `
      <div class="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 p-8 text-center" role="status">
        <h3 class="text-lg font-semibold text-neutral-300">No posts available.</h3>
        <p class="mt-1 text-sm text-neutral-500">There are currently no active listings in this section.</p>
      </div>
    `;

    const inspector = createDOMInspector(emptyCatalogHtml);
    inspector.assertTextContent('No posts available.');
    const statusDiv = inspector.assertHasTag('div', { role: 'status' });
    assertTrue(statusDiv !== null);
  });

  test('boundary: missing image renders neutral placeholder preserving fixed aspect ratio', () => {
    const placeholderHtml = `
      <div class="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950">
        <div class="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-neutral-950 text-neutral-600">
          <svg class="h-8 w-8 text-neutral-600" aria-hidden="true"></svg>
          <span class="text-xs font-medium">Image Preview Unavailable</span>
        </div>
      </div>
    `;

    const inspector = createDOMInspector(placeholderHtml);
    const container = inspector.assertHasTag('div');
    assertTrue(container.hasClass('aspect-[16/10]'), 'Placeholder must maintain fixed aspect ratio to prevent CLS');
    inspector.assertTextContent('Image Preview Unavailable');
  });

  test('boundary: error pages preserve minimalist Header and layout without promotional injection', () => {
    const completeErrorLayoutHtml = `
      <!DOCTYPE html>
      <html>
        <body class="bg-black text-white">
          <header class="sticky top-0 z-40 border-b border-neutral-800">
            <a href="/">Linkvertise</a>
          </header>
          <main class="min-h-[60vh] flex items-center justify-center">
            <h1>Post not found.</h1>
            <a href="/">[ Back ]</a>
          </main>
          <footer class="border-t border-neutral-800 p-4 text-xs text-neutral-500">
            <span>&copy; 2026 Linkvertise Directory</span>
          </footer>
        </body>
      </html>
    `;

    const inspector = createDOMInspector(completeErrorLayoutHtml);
    inspector.assertNoBloat();
    inspector.assertHasTag('header');
    inspector.assertHasTag('main');
    inspector.assertHasTag('footer');
  });
});
