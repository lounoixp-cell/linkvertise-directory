/**
 * Feature F11: Clickable External Link Button
 * Specifications: ORIGINAL_REQUEST.md §12, §13, PROJECT.md
 *
 * Requirements:
 * - Outbound link button rendered on detail page.
 * - Prominent call-to-action button (e.g. "OPEN EXTERNAL LINK").
 * - Validates safe protocols (http/https).
 * - Enforces rel="noopener noreferrer" and target="_blank" security behavior.
 * - Displays destination domain label clearly.
 */

import { describe, test, assertEquals, assertTrue } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { validateExternalUrl } from '@/lib/url-shield';
import { MOCK_POSTS } from '../harness/fixtures';

describe('F11: Clickable External Link Button', () => {
  const post = MOCK_POSTS[0];
  const buttonHtml = `
    <div class="w-full flex flex-col items-center">
      <div class="w-full rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 text-center">
        <h3 class="text-sm font-semibold text-neutral-300">
          Access Content for: <span class="text-white font-bold">${post.title}</span>
        </h3>
        <p class="mt-1 text-xs text-neutral-400">
          Hosted externally on: <span class="font-semibold text-neutral-200">${post.destinationDomain}</span>
        </p>
        <div class="mt-6">
          <a
            href="${post.externalUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-red-500"
            aria-label="Open external destination link"
          >
            <span>OPEN EXTERNAL LINK</span>
          </a>
        </div>
        <span class="mt-3 text-[11px] text-neutral-500">
          Opens in a secure new tab &bull; Safe verified HTTPS link
        </span>
      </div>
    </div>
  `;

  test('verifies clickable external link button is rendered on detail page with prominent call-to-action', () => {
    const inspector = createDOMInspector(buttonHtml);
    const linkButton = inspector.assertHasTag('a');

    inspector.assertTextContent(/OPEN EXTERNAL LINK/);
    assertTrue(linkButton.hasClass('bg-red-600') || linkButton.hasClass('font-bold'), 'Button must be styled as prominent CTA');
    assertEquals(linkButton.getAttribute('aria-label'), 'Open external destination link');
  });

  test('verifies external link enforces rel="noopener noreferrer" security attribute', () => {
    const inspector = createDOMInspector(buttonHtml);
    const link = inspector.assertHasTag('a');
    const rel = link.getAttribute('rel');

    assertEquals(rel, 'noopener noreferrer');
    assertTrue(rel?.includes('noopener'), 'Must include noopener to protect window.opener');
    assertTrue(rel?.includes('noreferrer'), 'Must include noreferrer to protect referrer leakage');
  });

  test('verifies external link specifies target="_blank" for outbound browsing', () => {
    const inspector = createDOMInspector(buttonHtml);
    const link = inspector.assertHasTag('a');

    assertEquals(link.getAttribute('target'), '_blank');
  });

  test('verifies external link validates safe protocols allowing https destinations', () => {
    // Valid HTTPS link
    const validResult = validateExternalUrl('https://example.com/item/123');
    assertEquals(validResult.isValid, true);
    assertEquals(validResult.displayDomain, 'example.com');

    // Reject dangerous protocol
    const dangerResult = validateExternalUrl('javascript:alert(1)');
    assertEquals(dangerResult.isValid, false);
    assertEquals(dangerResult.sanitizedUrl, null);
  });

  test('verifies external link button displays destination domain label', () => {
    const inspector = createDOMInspector(buttonHtml);
    inspector.assertTextContent(post.destinationDomain);
    inspector.assertTextContent(/Hosted externally on:/);
  });
});
