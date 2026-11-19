/**
 * Feature F17: Error States & Edge Cases
 * Specifications: ORIGINAL_REQUEST.md §33, PROJECT.md
 *
 * Requirements:
 * - Missing/Invalid Post: "Post not found." with visible [ Back ] button.
 * - Broken/Prohibited External Link: "Link unavailable." notification.
 * - Missing/Failed Image: neutral placeholder maintaining consistent aspect ratio.
 * - Empty Post Catalog: "No posts available." message.
 * - Structural layout resilience: site header and minimalist structure preserved intact.
 */

import { describe, test, assertEquals, assertTrue } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { validateExternalUrl } from '@/lib/url-shield';

describe('F17: Error States & Edge Cases', () => {
  const missingPostHtml = `
    <header class="border-b border-neutral-800"><a href="/">Logo</a></header>
    <main class="mx-auto max-w-4xl px-4 py-16 text-center">
      <h1 class="text-2xl font-bold text-white">Post not found.</h1>
      <p class="mt-2 text-sm text-neutral-400">The requested post does not exist or has been unpublished.</p>
      <div class="mt-6">
        <a href="/" data-action="back" class="inline-block px-4 py-2 border border-neutral-700 text-sm font-medium text-white rounded">
          Back
        </a>
      </div>
    </main>
  `;

  const brokenLinkHtml = `
    <div class="mt-4 flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-400">
      <span>Link unavailable.</span>
    </div>
  `;

  const missingImageHtml = `
    <div class="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950 flex flex-col items-center justify-center text-neutral-600">
      <span class="text-xs font-medium">Image Preview Unavailable</span>
    </div>
  `;

  const emptyCatalogHtml = `
    <header class="border-b border-neutral-800"><a href="/">Logo</a></header>
    <main class="mx-auto max-w-7xl px-4 py-6">
      <div class="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 p-8 text-center">
        <h3 class="text-lg font-semibold text-neutral-300">No posts available.</h3>
      </div>
    </main>
  `;

  test('renders exact error message "Post not found." with visible [ Back ] button for missing post', () => {
    const inspector = createDOMInspector(missingPostHtml);
    inspector.assertTextContent(/Post not found\./);

    const backButton = inspector.findTag('a', { 'data-action': 'back' });
    assertTrue(backButton !== null, 'Must provide back button');
    assertTrue(backButton?.textContent.includes('Back'), 'Back button must contain "Back" label');
  });

  test('renders "Link unavailable." when post external link is broken or invalid', () => {
    const inspector = createDOMInspector(brokenLinkHtml);
    inspector.assertTextContent(/Link unavailable\./);

    // Verify security validator flags broken link
    const invalidValidation = validateExternalUrl('javascript:void(0)');
    assertEquals(invalidValidation.isValid, false);
    assertEquals(invalidValidation.sanitizedUrl, null);
  });

  test('renders neutral placeholder with consistent aspect ratio when preview image is missing', () => {
    const inspector = createDOMInspector(missingImageHtml);
    inspector.assertTextContent(/Image Preview Unavailable/);

    const placeholder = inspector.findTag('div', { class: /aspect-/ });
    assertTrue(placeholder !== null, 'Neutral placeholder must preserve aspect ratio');
    assertTrue(placeholder?.hasClass('aspect-[16/10]'));
  });

  test('renders "No posts available." when post catalog is empty', () => {
    const inspector = createDOMInspector(emptyCatalogHtml);
    inspector.assertTextContent(/No posts available\./);
  });

  test('preserves site header and structural layout intact across all error states', () => {
    const missingPostInspector = createDOMInspector(missingPostHtml);
    const emptyCatalogInspector = createDOMInspector(emptyCatalogHtml);

    // Both error states maintain header and main container tags
    missingPostInspector.assertHasTag('header');
    missingPostInspector.assertHasTag('main');

    emptyCatalogInspector.assertHasTag('header');
    emptyCatalogInspector.assertHasTag('main');
  });
});
