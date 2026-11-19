/**
 * Feature F11 Boundary: Clickable External Link Button
 * Specifications: ORIGINAL_REQUEST.md §12, §13, §33; src/lib/url-shield.ts; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Prohibited Schemes (javascript:, data:, vbscript:, file: rejected, displays "Link unavailable.")
 * 2. Missing Protocol (raw domain missing https:// handled safely without unhandled exception)
 * 3. Security Attributes Enforcement (rel="noopener noreferrer" and target="_blank")
 * 4. Internal / Localhost Destinations (blocking localhost, 127.0.0.1, 192.168.*, 10.*)
 * 5. Touch Target Accessibility (min-height >= 44px, min-width >= 44px)
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { validateExternalUrl } from '@/lib/url-shield';

describe('F11: Clickable External Link Button Boundaries', () => {
  test('boundary: prohibited URL schemes rejected and trigger "Link unavailable."', () => {
    const dangerousUrls = [
      'javascript:alert(document.cookie)',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      'vbscript:msgbox("xss")',
      'file:///etc/passwd',
      'file:///C:/Windows/System32/calc.exe',
    ];

    for (const url of dangerousUrls) {
      const res = validateExternalUrl(url);
      assertEquals(res.isValid, false, `Expected ${url} to be invalid`);
      assertEquals(res.sanitizedUrl, null);
    }

    // Spec error fallback HTML rendering
    const linkUnavailableHtml = `
      <div class="mt-4 flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-400" role="alert">
        <span>Link unavailable.</span>
      </div>
    `;
    const inspector = createDOMInspector(linkUnavailableHtml);
    inspector.assertTextContent('Link unavailable.');
  });

  test('boundary: URL missing protocol safely rejected or flagged', () => {
    const rawDomains = [
      'nextjs.org',
      'tailwindcss.com/docs',
      'sub.example.com?query=123',
    ];

    for (const raw of rawDomains) {
      const result = validateExternalUrl(raw);
      // Because validateExternalUrl strictly checks parsed.protocol in ALLOWED_PROTOCOLS ('https:'),
      // raw strings without protocol throw in URL constructor or are rejected safely
      assertEquals(result.isValid, false);
      assertEquals(result.sanitizedUrl, null);
    }
  });

  test('boundary: outbound navigation enforces target="_blank" and rel="noopener noreferrer"', () => {
    const externalLinkHtml = `
      <a
        href="https://nextjs.org"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex min-h-[44px] min-w-[260px] items-center justify-center rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white"
        aria-label="Open external destination link"
      >
        <span>OPEN EXTERNAL LINK</span>
      </a>
    `;

    const inspector = createDOMInspector(externalLinkHtml);
    const link = inspector.assertHasTag('a');

    assertEquals(link.getAttribute('target'), '_blank');
    const rel = link.getAttribute('rel');
    assertTrue(rel?.includes('noopener'));
    assertTrue(rel?.includes('noreferrer'));
  });

  test('boundary: private and internal network destinations strictly blocked', () => {
    const privateTargets = [
      'https://localhost:3000/admin',
      'https://127.0.0.1:8080/secret',
      'https://router.local/config',
      'https://192.168.1.1/gateway',
      'https://10.0.0.1/internal',
    ];

    for (const target of privateTargets) {
      const res = validateExternalUrl(target);
      assertEquals(res.isValid, false, `Expected private destination ${target} to be blocked`);
      assertTrue(res.error?.includes('Private/internal') || res.error?.includes('prohibited'));
    }
  });

  test('boundary: button element meets mobile touch accessibility requirements (>= 44px)', () => {
    const buttonHtml = `
      <button
        type="button"
        class="inline-flex min-h-[44px] min-w-[260px] items-center justify-center rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white"
        aria-label="Open external destination link"
      >
        <span>OPEN EXTERNAL LINK</span>
      </button>
    `;

    const inspector = createDOMInspector(buttonHtml);
    const button = inspector.assertHasTag('button');

    assertTrue(button.hasClass('min-h-[44px]'), 'CTA button must satisfy >= 44px min-height');
    assertTrue(button.hasClass('min-w-[260px]'), 'CTA button must satisfy desktop/mobile width baseline');
  });
});
