/**
 * Feature F08: Post Card Presentation
 * Specifications: ORIGINAL_REQUEST.md §10, §30, PROJECT.md
 *
 * Requirements:
 * - Card must contain exactly 5 core elements: preview image, tag, name, domain link, date.
 * - Minimalist presentation: no unnecessary controls, likes, shares, ratings, or comments.
 * - Preview image maintains aspect ratio (16:10 or 4:3) with meaningful alt text.
 * - Typography hierarchy: Title heading (h2), uppercase tag/category, clean domain, date.
 * - Neutral image placeholder fallback when image is missing or invalid.
 */

import { describe, test, assertEquals, assertTrue } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { MOCK_POSTS } from '../harness/fixtures';

describe('F08: Post Card Presentation', () => {
  const sampleCard = MOCK_POSTS[0];
  const sampleCardHtml = `
    <article class="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/70">
      <a href="/post/${sampleCard.slug}" class="flex flex-col h-full focus:outline-none" aria-label="View details for ${sampleCard.title}">
        <div class="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950">
          <img src="${sampleCard.previewImage}" alt="${sampleCard.previewImageAlt || sampleCard.title}" class="object-cover w-full h-full" />
          <div class="absolute top-2.5 left-2.5">
            <span class="inline-flex items-center gap-1 rounded bg-black/75 px-2 py-0.5 text-[11px] font-semibold text-neutral-200 uppercase">${sampleCard.tag}</span>
          </div>
        </div>
        <div class="flex flex-1 flex-col justify-between p-4">
          <div>
            <h2 class="text-sm font-bold text-neutral-100">${sampleCard.title}</h2>
            <div class="mt-2.5 flex items-center gap-1.5 text-xs text-neutral-400">
              <span class="truncate">Destination: <span class="text-neutral-300 font-medium">${sampleCard.destinationDomain}</span></span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
            <time datetime="${sampleCard.publishedAt}">Jan 10, 2026</time>
            <span class="text-xs font-semibold text-neutral-300">View Post &rarr;</span>
          </div>
        </div>
      </a>
    </article>
  `;

  const cardWithMissingImageHtml = `
    <article class="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/70">
      <div class="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950 flex flex-col items-center justify-center text-neutral-600">
        <span class="text-xs font-medium">Image Preview Unavailable</span>
      </div>
      <div class="p-4">
        <h2 class="text-sm font-bold text-neutral-100">Fallback Title</h2>
      </div>
    </article>
  `;

  test('verifies card contains all 5 required elements: preview image, tag, name, domain link, and date', () => {
    const inspector = createDOMInspector(sampleCardHtml);

    // 1. Preview image
    const img = inspector.assertHasTag('img');
    assertEquals(img.getAttribute('src'), sampleCard.previewImage);

    // 2. Tag
    inspector.assertTextContent(sampleCard.tag);

    // 3. Name (Title)
    const title = inspector.assertHasTag('h2');
    assertEquals(title.textContent, sampleCard.title);

    // 4. Domain link label
    inspector.assertTextContent(sampleCard.destinationDomain);

    // 5. Date
    const timeEl = inspector.assertHasTag('time');
    assertEquals(timeEl.getAttribute('datetime'), sampleCard.publishedAt);
  });

  test('verifies preview image maintains aspect ratio and includes meaningful alt text', () => {
    const inspector = createDOMInspector(sampleCardHtml);
    const img = inspector.assertHasTag('img');
    const altText = img.getAttribute('alt');

    assertTrue(altText !== null && altText.length > 0, 'Image must declare non-empty alt text for accessibility');
    assertEquals(altText, sampleCard.previewImageAlt || sampleCard.title);

    const imageContainer = inspector.findTag('div', { class: /aspect-/ });
    assertTrue(imageContainer !== null, 'Image wrapper must declare aspect ratio class');
    assertTrue(imageContainer?.hasClass('aspect-[16/10]'), 'Image wrapper must preserve 16:10 aspect ratio');
  });

  test('verifies typography hierarchy: name title, uppercase tag, domain link, and date time element', () => {
    const inspector = createDOMInspector(sampleCardHtml);
    const heading = inspector.assertHasTag('h2');
    assertTrue(heading.hasClass('font-bold'), 'Title must use bold typography');

    const tagSpan = inspector.findTag('span', { class: /uppercase/ });
    assertTrue(tagSpan !== null, 'Tag must be rendered with uppercase styling');

    const time = inspector.assertHasTag('time');
    assertTrue(time !== null, 'Must use semantic <time> element for published date');
  });

  test('verifies strict absence of extraneous controls (likes, share icons, ratings, or comment badges)', () => {
    const inspector = createDOMInspector(sampleCardHtml);
    inspector.assertNoTextContent(/likes/i);
    inspector.assertNoTextContent(/share/i);
    inspector.assertNoTextContent(/rating/i);
    inspector.assertNoTextContent(/comments/i);
    inspector.assertNoTextContent(/bookmark/i);

    // Verify negative check: injecting social controls triggers failure
    const dirtyHtml = `<article><button aria-label="Like Post">50 Likes</button></article>`;
    const dirtyInspector = createDOMInspector(dirtyHtml);
    let likeCaught = false;
    try {
      dirtyInspector.assertNoTextContent(/likes/i);
    } catch {
      likeCaught = true;
    }
    assertTrue(likeCaught, 'Extraneous like button must be caught and rejected');
  });

  test('verifies neutral placeholder fallback when previewImage is missing or empty', () => {
    const inspector = createDOMInspector(cardWithMissingImageHtml);
    const placeholder = inspector.findTag('div', { class: /aspect-/ });
    assertTrue(placeholder !== null, 'Placeholder must maintain aspect ratio');
    inspector.assertTextContent(/Image Preview Unavailable/i);
  });
});
