/**
 * Feature F12: URL Shield UX Protection
 * Specifications: ORIGINAL_REQUEST.md §13, PROJECT.md
 *
 * Requirements:
 * - Discourages casual URL copying as a UX measure without client secret leakage.
 * - Validates safe URL protocols and rejects dangerous schemes (javascript:, data:, vbscript:, file:).
 * - Extracts clean destination domain for display, stripping www. prefix.
 * - Protects against internal/local destinations (localhost, 127.0.0.1, 192.168.x).
 * - Handles malformed, null, or empty URLs gracefully without throwing uncaught exceptions.
 */

import { describe, test, assertEquals, assertTrue } from '../harness';
import { validateExternalUrl, encodeToken, decodeToken } from '@/lib/url-shield';

describe('F12: URL Shield UX Protection', () => {
  test('validates safe URL schemes (https:) and accepts standard external destinations', () => {
    const validUrls = [
      'https://linkvertise.com/download/12345',
      'https://github.com/org/repo',
      'https://developer.mozilla.org/en-US/docs/Web',
    ];

    for (const url of validUrls) {
      const result = validateExternalUrl(url);
      assertEquals(result.isValid, true, `Expected URL to be valid: ${url}`);
      assertTrue(result.sanitizedUrl !== null);
      assertTrue(result.displayDomain.length > 0);
    }
  });

  test('rejects dangerous execution schemes (javascript:, data:, vbscript:, file:)', () => {
    const dangerousSchemes = [
      'javascript:alert(document.cookie)',
      'JAVASCRIPT:void(0)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:MsgBox("malicious")',
      'file:///etc/passwd',
      'file://C:/Windows/System32/calc.exe',
    ];

    for (const dangerous of dangerousSchemes) {
      const result = validateExternalUrl(dangerous);
      assertEquals(result.isValid, false, `Expected dangerous scheme to be rejected: ${dangerous}`);
      assertEquals(result.sanitizedUrl, null);
      assertTrue(result.error !== undefined);
    }
  });

  test('extracts clean destination domain from complex URLs with paths, queries, and www prefixes', () => {
    const testCases = [
      { input: 'https://www.example.com/sub/path?param=1&foo=bar', expectedDomain: 'example.com' },
      { input: 'https://cdn.sanity.io/images/project/123.jpg', expectedDomain: 'cdn.sanity.io' },
      { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expectedDomain: 'youtube.com' },
    ];

    for (const tc of testCases) {
      const result = validateExternalUrl(tc.input);
      assertEquals(result.isValid, true);
      assertEquals(result.displayDomain, tc.expectedDomain);
    }
  });

  test('rejects private and internal network destinations', () => {
    const internalUrls = [
      'https://localhost:3000/admin',
      'https://127.0.0.1/status',
      'https://192.168.1.1/router',
      'https://10.0.0.1/secrets',
    ];

    for (const internal of internalUrls) {
      const result = validateExternalUrl(internal);
      assertEquals(result.isValid, false, `Internal destination must be blocked: ${internal}`);
      assertEquals(result.sanitizedUrl, null);
      assertTrue(result.error?.includes('Private/internal') || false);
    }
  });

  test('handles malformed, invalid, or empty URLs gracefully without throwing exceptions', () => {
    const invalidInputs = [
      '',
      '   ',
      'not-a-valid-url-format',
      'htp://misspelled',
      '://missing-protocol',
      null as any,
      undefined as any,
    ];

    for (const input of invalidInputs) {
      let threw = false;
      let result;
      try {
        result = validateExternalUrl(input);
      } catch {
        threw = true;
      }
      assertEquals(threw, false, `validateExternalUrl should not throw on input: ${input}`);
      assertEquals(result?.isValid, false);
      assertEquals(result?.sanitizedUrl, null);
    }

    // Verify token encode/decode obfuscation helpers
    const original = 'https://linkvertise.com/target';
    const encoded = encodeToken(original);
    assertTrue(encoded !== original, 'Token must be obfuscated');
    const decoded = decodeToken(encoded);
    assertEquals(decoded, original, 'Decoded token must match original string');
  });
});
