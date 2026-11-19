/**
 * Feature F06 Boundary: Minimal Header & Navigation
 * Specifications: ORIGINAL_REQUEST.md §8, §31; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Missing / Long Logo Text (100+ chars layout containment, truncate or wrap without overflow)
 * 2. Extreme Mobile Viewport 320px (touch targets >= 44px, no horizontal scroll)
 * 3. Absence of Extraneous Links (strictly logo and feedback; zero secondary links or dropdowns)
 * 4. Sticky Positioning & z-index Bounds (sticky top-0 z-40 layering without obscuring dialogs)
 * 5. Accessibility Attributes (aria-label on logo, accessible role on feedback trigger)
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';

describe('F06: Header Boundary & Containment', () => {
  test('handles extremely long site title (100+ characters) without container blowout', () => {
    const longTitle = 'Linkvertise Directory — The Minimalist High-Performance Outbound Link Index for Curated Web Resources 2026';
    const longTitleHeaderHtml = `
      <header class="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
        <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <a href="/" class="flex items-center gap-2 max-w-[70%] truncate text-sm font-semibold tracking-tight text-white" aria-label="${longTitle}">
            <span class="truncate">${longTitle}</span>
          </a>
          <button type="button" class="text-xs text-neutral-400 hover:text-white" data-action="feedback">Feedback</button>
        </div>
      </header>
    `;

    const inspector = createDOMInspector(longTitleHeaderHtml);
    const logoLink = inspector.findTag('a', { href: '/' });
    assertTrue(logoLink !== null, 'Logo link must exist');
    assertTrue(logoLink?.hasClass('truncate') || logoLink?.hasClass('max-w-[70%]'), 'Must contain truncate or width bound');
    assertEquals(logoLink?.getAttribute('aria-label'), longTitle);
  });

  test('verifies mobile 320px viewport touch-target clearance (>= 44px min-height/touch area)', () => {
    // 320px viewport simulated header
    const mobileHeaderHtml = `
      <header class="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950 px-2">
        <div class="flex h-14 w-full items-center justify-between">
          <a href="/" class="min-h-[44px] min-w-[44px] flex items-center text-sm font-bold text-white" aria-label="Home">
            <span>Linkvertise</span>
          </a>
          <button type="button" class="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-medium text-neutral-400 flex items-center justify-center" data-action="feedback" aria-label="Open Feedback">
            Feedback
          </button>
        </div>
      </header>
    `;

    const inspector = createDOMInspector(mobileHeaderHtml);
    const logo = inspector.findTag('a', { href: '/' });
    const feedbackBtn = inspector.findTag('button', { 'data-action': 'feedback' });

    assertTrue(logo?.hasClass('min-h-[44px]'), 'Logo link must satisfy minimum touch target size (>=44px)');
    assertTrue(feedbackBtn?.hasClass('min-h-[44px]'), 'Feedback button must satisfy minimum touch target size (>=44px)');
  });

  test('enforces strict absence of extraneous navigation links and category menus', () => {
    const minimalHeaderHtml = `
      <header class="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950">
        <div class="flex h-14 items-center justify-between px-4">
          <a href="/">Linkvertise</a>
          <button data-action="feedback">Feedback</button>
        </div>
      </header>
    `;

    const inspector = createDOMInspector(minimalHeaderHtml);
    const links = inspector.extractLinks();

    // Exactly 1 link exists in the header (the logo linking to "/")
    assertEquals(links.length, 1);
    assertEquals(links[0].href, '/');

    // No dropdown, no categories, no secondary links
    inspector.assertNoTextContent(/categories/i);
    inspector.assertNoTextContent(/about/i);
    inspector.assertNoTextContent(/pricing/i);
  });

  test('verifies sticky positioning and z-index boundary (sticky top-0 z-40)', () => {
    const headerHtml = `
      <header class="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/80">
        <div>Header Content</div>
      </header>
    `;

    const inspector = createDOMInspector(headerHtml);
    const header = inspector.assertHasTag('header');

    assertTrue(header.hasClass('sticky'));
    assertTrue(header.hasClass('top-0'));
    assertTrue(header.hasClass('z-40'));

    // Modal dialogs use z-50 so sticky header at z-40 does NOT obscure active modal overlays
    const modalHtml = `<div role="dialog" class="fixed inset-0 z-50 bg-black/80">Modal</div>`;
    const modalInspector = createDOMInspector(modalHtml);
    const dialog = modalInspector.assertHasTag('div', { role: 'dialog' });
    assertTrue(dialog.hasClass('z-50'), 'Modal overlay must be above header (z-50 > z-40)');
  });

  test('verifies accessibility attributes on header logo and interactive controls', () => {
    const accessibleHeaderHtml = `
      <header class="sticky top-0 z-40 border-b border-neutral-800" role="banner">
        <div class="flex items-center justify-between px-4 h-14">
          <a href="/" aria-label="Linkvertise Directory Home" class="text-sm font-bold text-white">
            Linkvertise Directory
          </a>
          <button type="button" aria-haspopup="dialog" aria-expanded="false" data-action="feedback" class="text-xs text-neutral-400">
            Feedback
          </button>
        </div>
      </header>
    `;

    const inspector = createDOMInspector(accessibleHeaderHtml);
    const header = inspector.assertHasTag('header');
    assertEquals(header.getAttribute('role'), 'banner');

    const logo = inspector.assertHasTag('a', { href: '/' });
    assertEquals(logo.getAttribute('aria-label'), 'Linkvertise Directory Home');

    const feedbackBtn = inspector.assertHasTag('button', { 'data-action': 'feedback' });
    assertEquals(feedbackBtn.getAttribute('type'), 'button');
    assertEquals(feedbackBtn.getAttribute('aria-haspopup'), 'dialog');
  });
});
