/**
 * URL Shield: Security & Validation Utility
 * Enforces safe link traversal, prevents malicious protocol injections (javascript:, data:),
 * strips user credentials, and provides safe domain abstraction for UI display.
 */

const ALLOWED_PROTOCOLS = ['https:', 'http:'];

export interface UrlValidationResult {
  isValid: boolean;
  sanitizedUrl: string | null;
  displayDomain: string;
  error?: string;
}

export function validateExternalUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, sanitizedUrl: null, displayDomain: '', error: 'URL is required' };
  }

  const trimmed = rawUrl.trim();

  // Guard against malicious pseudoprotocols & control characters
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    /[\x00-\x1F\x7F]/.test(trimmed)
  ) {
    return {
      isValid: false,
      sanitizedUrl: null,
      displayDomain: '',
      error: 'Prohibited or unsafe URL scheme',
    };
  }

  try {
    const parsed = new URL(trimmed);

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return {
        isValid: false,
        sanitizedUrl: null,
        displayDomain: '',
        error: `Only HTTP and HTTPS links are permitted (received ${parsed.protocol})`,
      };
    }

    // Reject local network / internal targets
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.')
    ) {
      return {
        isValid: false,
        sanitizedUrl: null,
        displayDomain: '',
        error: 'Private/internal network destinations are prohibited',
      };
    }

    // Strip basic auth / userinfo credentials to avoid leaking credentials
    parsed.username = '';
    parsed.password = '';

    // Clean display domain (e.g., linkvertise.com, drive.google.com)
    const displayDomain = hostname.replace(/^www\./, '');

    return {
      isValid: true,
      sanitizedUrl: parsed.toString(),
      displayDomain,
    };
  } catch {
    return {
      isValid: false,
      sanitizedUrl: null,
      displayDomain: '',
      error: 'Malformed URL structure',
    };
  }
}

/**
 * Base64 obfuscation helper for safe client-side transport
 * Discourages casual copy/paste from DOM inspect without claiming absolute encryption.
 */
export function encodeToken(str: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(str).toString('base64');
  }
  return btoa(str);
}

export function decodeToken(token: string): string {
  try {
    if (typeof window === 'undefined') {
      return Buffer.from(token, 'base64').toString('utf-8');
    }
    return atob(token);
  } catch {
    return '';
  }
}
