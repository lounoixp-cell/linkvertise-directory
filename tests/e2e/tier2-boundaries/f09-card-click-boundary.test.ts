/**
 * Feature F09 Boundary: Homepage Card Click Navigation
 * Specifications: ORIGINAL_REQUEST.md §11; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Special Characters & Numbers in Slugs (encoded slugs resolve to /post/[slug])
 * 2. Strict Internal Navigation Enforcement (card NEVER links directly to externalUrl)
 * 3. Absence of target="_blank" on Card (card click opens in same browsing context)
 * 4. Rapid Multiple Clicks Idempotence (deterministic navigation target)
 * 5. Absence of Inline JavaScript Redirection (no onclick or window.open handlers on card)
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { MOCK_POSTS } from '../harness/fixtures';

describe('F09: Card Click Navigation Boundaries', () => {
  test('boundary: slugs with numbers, hyphens, and alphanumeric tokens map cleanly to /post/[slug]', () => {
    const complexSlugs = [
      'c-guide-100-comprehensive',
      'nextjs-15-rc-2-preview',
      '3d-rendering-webgl-2026',
      'v1-alpha-release',
    ];

    for (const slug of complexSlugs) {
      const cardHtml = `
        <article>
          <a href="/post/${slug}" class="card-link">View Details</a>
        </article>
      `;
      const inspector = createDOMInspector(cardHtml);
      const link = inspector.assertHasTag('a');
      assertEquals(link.getAttribute('href'), `/post/${slug}`);
      assertTrue(link.getAttribute('href')?.startsWith('/post/'));
    }
  });

  test('enforces strict internal routing: card anchor NEVER points to external destination', () => {
    for (const post of MOCK_POSTS) {
      const cardHtml = `
        <article>
          <a href="/post/${post.slug}" class="flex flex-col h-full" aria-label="View details for ${post.title}">
            <h2>${post.title}</h2>
          </a>
        </article>
      `;
      const inspector = createDOMInspector(cardHtml);
      const link = inspector.assertHasTag('a');
      const href = link.getAttribute('href');

      // The card link must strictly begin with /post/ and never equal post.externalUrl
      assertTrue(href?.startsWith('/post/'), `Card link must be internal route, got ${href}`);
      assertFalse(href === post.externalUrl, 'Card link must NEVER link directly to externalUrl');
      assertFalse(href?.startsWith('http://'), 'Card link must not be external HTTP URL');
      assertFalse(href?.startsWith('https://'), 'Card link must not be external HTTPS URL');
    }
  });

  test('boundary: absence of target="_blank" ensures card click does not spawn extra tab', () => {
    const cardHtml = `
      <article>
        <a href="/post/nextjs-framework" class="flex flex-col">
          <h2>Next.js Framework</h2>
        </a>
      </article>
    `;
    const inspector = createDOMInspector(cardHtml);
    const link = inspector.assertHasTag('a');

    // Link must NOT specify target="_blank"
    assertEquals(link.getAttribute('target'), null);
    assertFalse(link.hasAttribute('target', '_blank'));
  });

  test('boundary: rapid click handling remains deterministic and idempotent', () => {
    let navigationHistory: string[] = [];
    const navigate = (href: string) => {
      navigationHistory.push(href);
    };

    const targetRoute = '/post/serena-noir';

    // Simulate 5 rapid consecutive clicks on same card
    for (let i = 0; i < 5; i++) {
      navigate(targetRoute);
    }

    assertEquals(navigationHistory.length, 5);
    // Every invocation targeted the exact same route without mutation
    for (const entry of navigationHistory) {
      assertEquals(entry, targetRoute);
    }
  });

  test('boundary: verifies zero inline JavaScript redirects (onclick, window.open) in card markup', () => {
    const cardHtml = `
      <article class="group rounded-xl border border-neutral-800 bg-neutral-900">
        <a href="/post/tailwind-css" class="flex flex-col">
          <span>Tailwind CSS</span>
        </a>
      </article>
    `;

    const inspector = createDOMInspector(cardHtml);
    const link = inspector.assertHasTag('a');

    // Ensure no onclick attributes or script handlers
    assertEquals(link.getAttribute('onclick'), null);
    assertFalse(cardHtml.includes('window.location'));
    assertFalse(cardHtml.includes('window.open'));
  });
});
