/**
 * Feature F09: Homepage Card Click Navigation
 * Specifications: ORIGINAL_REQUEST.md §11, PROJECT.md
 *
 * Requirements:
 * - Clicking a card must navigate to the internal post detail page (/post/[slug]).
 * - Card MUST NOT directly open the external destination.
 * - Internal card link must NOT use target="_blank".
 * - URL slug in href must properly encode kebab-case path.
 * - Card must maintain interactive accessibility with aria-label and keyboard focus.
 */

import { describe, test, assertEquals, assertNotEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { MOCK_POSTS } from '../harness/fixtures';

describe('F09: Homepage Card Click Navigation', () => {
  const post = MOCK_POSTS[0];
  const cardHtml = `
    <article class="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/70 focus-within:ring-2 focus-within:ring-neutral-400">
      <a href="/post/${post.slug}" class="flex flex-col h-full focus:outline-none" aria-label="View details for ${post.title}">
        <div class="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950">
          <img src="${post.previewImage}" alt="${post.title}" class="object-cover" />
        </div>
        <div class="p-4">
          <h2 class="text-sm font-bold text-neutral-100">${post.title}</h2>
          <span class="text-xs text-neutral-400">Destination: ${post.destinationDomain}</span>
        </div>
      </a>
    </article>
  `;

  test('verifies card navigation links to internal route /post/[slug]', () => {
    const inspector = createDOMInspector(cardHtml);
    const cardAnchor = inspector.assertHasTag('a');
    const href = cardAnchor.getAttribute('href');

    assertEquals(href, `/post/${post.slug}`);
    assertTrue(href !== null && href.startsWith('/post/'), 'Card link must be internal route starting with /post/');
  });

  test('verifies card anchor does NOT link directly to externalUrl', () => {
    const inspector = createDOMInspector(cardHtml);
    const cardAnchor = inspector.assertHasTag('a');
    const href = cardAnchor.getAttribute('href');

    assertNotEquals(href, post.externalUrl, 'Card anchor MUST NOT directly point to externalUrl');
    assertTrue(!href?.startsWith('http://') && !href?.startsWith('https://'), 'Card must not have outbound protocol');
  });

  test('verifies card anchor does not use target="_blank" for internal navigation', () => {
    const inspector = createDOMInspector(cardHtml);
    const cardAnchor = inspector.assertHasTag('a');
    const target = cardAnchor.getAttribute('target');

    assertNotEquals(target, '_blank', 'Internal navigation link must NOT use target="_blank"');
    assertEquals(target, null, 'Internal link should default to same-window navigation');
  });

  test('verifies card correctly encodes kebab-cased slugs in href', () => {
    const specialPost = MOCK_POSTS.find((p) => p.slug.includes('-')) || post;
    const testHtml = `<a href="/post/${encodeURIComponent(specialPost.slug)}">View</a>`;
    const inspector = createDOMInspector(testHtml);
    const anchor = inspector.assertHasTag('a');
    const href = anchor.getAttribute('href');

    assertEquals(href, `/post/${specialPost.slug}`);
    assertTrue(/^[a-z0-9-]+$/.test(specialPost.slug), 'Slug must follow kebab-case lowercase conventions');
  });

  test('verifies card interactive accessibility and keyboard focus state', () => {
    const inspector = createDOMInspector(cardHtml);
    const cardAnchor = inspector.assertHasTag('a');
    const ariaLabel = cardAnchor.getAttribute('aria-label');

    assertTrue(ariaLabel !== null && ariaLabel.length > 0, 'Card link must declare an accessible aria-label');
    assertTrue(ariaLabel?.includes(post.title), 'aria-label must include post title for screen readers');

    const article = inspector.assertHasTag('article');
    assertTrue(article.hasClass('focus-within:ring-2'), 'Card container must declare visible focus-within styling');
  });
});
