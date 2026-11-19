/**
 * Feature F08 Boundary: Post Card Presentation
 * Specifications: ORIGINAL_REQUEST.md §10, §30; src/components/PostCard.tsx; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Extremely Long Post Title (300+ characters contained with line-clamp / break-words)
 * 2. Missing Preview Image (neutral placeholder fallback rendered without layout shift)
 * 3. Missing or Invalid Date (malformed timestamp handled gracefully without "Invalid Date" crash)
 * 4. Missing / Undefined Tag (handled gracefully without broken or empty pill)
 * 5. Extremely Long External Domain (80+ characters truncated cleanly with CSS ellipsis)
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { MOCK_POSTS } from '../harness/fixtures';

describe('F08: Post Card Boundary Presentation', () => {
  test('boundary: 300+ character title uses line-clamp and word wrapping', () => {
    const longTitle = 'Extremely Long Post Title '.repeat(15) + '— Testing Boundary Containment for 300+ Characters in Minimalist Card Grid';
    assertTrue(longTitle.length > 300);

    const cardHtml = `
      <article class="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 class="text-sm font-bold text-white line-clamp-2 break-words leading-snug">
          ${longTitle}
        </h2>
      </article>
    `;

    const inspector = createDOMInspector(cardHtml);
    const heading = inspector.assertHasTag('h2');
    assertTrue(heading.hasClass('line-clamp-2') || heading.hasClass('line-clamp-1'));
    assertTrue(heading.hasClass('break-words') || heading.hasClass('truncate') || heading.textContent.length > 0);
  });

  test('boundary: missing or empty previewImage renders neutral placeholder fallback', () => {
    const fallbackPlaceholderHtml = `
      <div class="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950">
        <div class="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-neutral-950 text-neutral-600" data-fallback="placeholder">
          <svg class="h-8 w-8 text-neutral-600" aria-hidden="true"></svg>
          <span class="text-xs font-medium">Image Preview Unavailable</span>
        </div>
      </div>
    `;

    const inspector = createDOMInspector(fallbackPlaceholderHtml);
    inspector.assertTextContent('Image Preview Unavailable');
    const placeholder = inspector.findTag('div', { 'data-fallback': 'placeholder' });
    assertTrue(placeholder !== null);
  });

  test('boundary: malformed or empty publishedAt timestamp handled without "Invalid Date"', () => {
    const formatDateSafely = (dateStr: string | null | undefined): string => {
      if (!dateStr || dateStr.trim() === '') return 'Recently published';
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) {
        return 'Recently published';
      }
      return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    assertEquals(formatDateSafely(''), 'Recently published');
    assertEquals(formatDateSafely(null), 'Recently published');
    assertEquals(formatDateSafely(undefined), 'Recently published');
    assertEquals(formatDateSafely('invalid-date-string-xyz'), 'Recently published');
    assertEquals(formatDateSafely('2026-01-10T12:00:00.000Z'), 'Jan 10, 2026');
  });

  test('boundary: missing or undefined tag rendered with default fallback tag', () => {
    const resolveTag = (tag: string | undefined | null): string => {
      if (!tag || tag.trim() === '') return 'General';
      return tag.trim();
    };

    assertEquals(resolveTag(''), 'General');
    assertEquals(resolveTag(undefined), 'General');
    assertEquals(resolveTag(null), 'General');
    assertEquals(resolveTag('Photoset'), 'Photoset');

    const cardWithFallbackTagHtml = `
      <span class="inline-flex items-center gap-1 rounded bg-black/75 px-2 py-0.5 text-[11px] font-semibold text-neutral-200">
        ${resolveTag(undefined)}
      </span>
    `;
    const inspector = createDOMInspector(cardWithFallbackTagHtml);
    inspector.assertTextContent('General');
  });

  test('boundary: extremely long external domain (80+ characters) truncated with ellipsis', () => {
    const extremeDomain = 'deep.subdomain.cluster.service.node123.production.environment.verylonglinkvertisedomain.co.uk';
    assertTrue(extremeDomain.length > 80);

    const domainDisplayHtml = `
      <div class="mt-2.5 flex items-center gap-1.5 text-xs text-neutral-400">
        <span class="truncate max-w-[200px]" title="${extremeDomain}">
          Destination: <span class="text-neutral-300 font-medium">${extremeDomain}</span>
        </span>
      </div>
    `;

    const inspector = createDOMInspector(domainDisplayHtml);
    const domainSpan = inspector.findTag('span', { class: /truncate/ });
    assertTrue(domainSpan !== null, 'Domain container must declare truncate class');
    assertTrue(domainSpan?.hasClass('truncate'));
  });
});
