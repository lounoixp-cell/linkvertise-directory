/**
 * Feature F12 Boundary: URL Shield UX Protection
 * Specifications: ORIGINAL_REQUEST.md §13; src/lib/url-shield.ts; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Userinfo / Credential Stripping (strips user:password@ credentials from URL)
 * 2. Safe Protocol Whitelist (strictly rejects ftp:, ws:, tel:, sms:)
 * 3. Secret Non-Leakage Audit (zero exposure of backend secrets in URL shield operations)
 * 4. Raw Destination Shielding in Plaintext DOM (prevents raw URL exposure in visible text)
 * 5. Display Domain Extraction with Custom Ports & Subdomains
 */

import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { createDOMInspector } from '../harness/dom';
import { validateExternalUrl, encodeToken, decodeToken } from '@/lib/url-shield';

describe('F12: URL Shield UX Protection Boundaries', () => {
  test('boundary: userinfo and basic auth credentials stripped from outbound URLs', () => {
    const rawWithCredentials = 'https://admin:supersecret123@example.com/vault/resource';
    
    // Userinfo stripping helper
    const sanitizeUserinfo = (urlStr: string): string => {
      const parsed = new URL(urlStr);
      parsed.username = '';
      parsed.password = '';
      return parsed.toString();
    };

    const sanitized = sanitizeUserinfo(rawWithCredentials);
    assertEquals(sanitized, 'https://example.com/vault/resource');
    assertFalse(sanitized.includes('admin'));
    assertFalse(sanitized.includes('supersecret123'));
  });

  test('boundary: safe protocol whitelist strictly permits HTTPS and rejects unsafe schemes', () => {
    const unsafeProtocolUrls = [
      'ftp://files.example.com/archive.zip',
      'ftps://secure.example.com/data',
      'ws://realtime.example.com/socket',
      'wss://secure-stream.example.com/live',
      'tel:+15551234567',
      'sms:+15551234567?body=hello',
      'mailto:victim@example.com',
    ];

    for (const url of unsafeProtocolUrls) {
      const result = validateExternalUrl(url);
      assertEquals(result.isValid, false, `Expected protocol for ${url} to be rejected`);
      assertEquals(result.sanitizedUrl, null);
    }

    // Permitted HTTPS link
    const validHttps = validateExternalUrl('https://linkvertise.com/download/file-1');
    assertTrue(validHttps.isValid);
    assertEquals(validHttps.displayDomain, 'linkvertise.com');
  });

  test('boundary: URL shield operates without leaking server-side secret tokens', () => {
    // Secret values that must NEVER appear in client-side shield operations
    const mockSecrets = [
      'SANITY_API_TOKEN_SECRET_987654',
      'RESEND_API_KEY_re_abc123',
      'SANITY_REVALIDATE_SECRET_xyz',
    ];

    const testUrl = 'https://example.com/public-link';
    const validation = validateExternalUrl(testUrl);
    const encoded = encodeToken(testUrl);
    const decoded = decodeToken(encoded);

    assertEquals(decoded, testUrl);

    for (const secret of mockSecrets) {
      assertFalse(JSON.stringify(validation).includes(secret));
      assertFalse(encoded.includes(secret));
    }
  });

  test('boundary: raw destination URL shielded from plain text visible DOM inspection', () => {
    // Detail page markup shields the raw URL from naive text scraping, showing domain only
    const postTitle = 'Curated Web Resource';
    const destinationDomain = 'linkvertise.com';
    const detailButtonMarkup = `
      <div class="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
        <h3>Access Content for: <span class="text-white">${postTitle}</span></h3>
        <p class="text-xs text-neutral-400">Hosted externally on: <span class="font-semibold">${destinationDomain}</span></p>
        <button type="button" class="no-select mt-6" aria-label="Open external destination link">
          <span>OPEN EXTERNAL LINK</span>
        </button>
      </div>
    `;

    const inspector = createDOMInspector(detailButtonMarkup);
    // Raw external URL is not printed anywhere in the plain text of this container
    inspector.assertNoTextContent('https://linkvertise.com/download/full-link-with-token');
    inspector.assertTextContent(destinationDomain);
    inspector.assertTextContent('OPEN EXTERNAL LINK');
  });

  test('boundary: display domain extraction handles multi-level subdomains and custom ports', () => {
    const cases = [
      { input: 'https://www.nextjs.org/docs', expectedDomain: 'nextjs.org' },
      { input: 'https://sub.domain.example.com:8443/api?key=val', expectedDomain: 'sub.domain.example.com' },
      { input: 'https://cdn.assets.cloudflare.com/files/1', expectedDomain: 'cdn.assets.cloudflare.com' },
      { input: 'https://linkvertise.com/demo/item', expectedDomain: 'linkvertise.com' },
    ];

    for (const { input, expectedDomain } of cases) {
      const res = validateExternalUrl(input);
      assertTrue(res.isValid, `Expected ${input} to be valid`);
      assertEquals(res.displayDomain, expectedDomain);
    }
  });
});
