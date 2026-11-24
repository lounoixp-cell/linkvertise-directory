import { NextRequest } from 'next/server';
import crypto from 'crypto';

export const SECURITY_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};

// In-memory brute force protection: tracks failed auth attempts per IP
interface RateLimitRecord {
  attempts: number;
  lockedUntil: number;
}
const authAttempts = new Map<string, RateLimitRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function getClientIp(req: NextRequest | Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export function checkRateLimit(ip: string): { allowed: boolean; remainingSec: number } {
  const record = authAttempts.get(ip);
  if (!record) return { allowed: true, remainingSec: 0 };

  const now = Date.now();
  if (record.lockedUntil > now) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingSec };
  }

  // Lockout expired; reset
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    authAttempts.delete(ip);
  }
  return { allowed: true, remainingSec: 0 };
}

export function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = authAttempts.get(ip) || { attempts: 0, lockedUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  authAttempts.set(ip, record);

  // Periodic cleanup if map grows too large
  if (authAttempts.size > 2000) {
    authAttempts.forEach((val, key) => {
      if (val.lockedUntil <= now && val.attempts === 0) authAttempts.delete(key);
    });
  }
}

export function recordSuccessfulAttempt(ip: string) {
  authAttempts.delete(ip);
}

/**
 * Constant-time hash comparison to prevent timing attack side-channel leaks (CWE-208)
 */
export function timingSafeCompare(candidate: string, secret: string): boolean {
  if (!candidate || !secret) return false;
  const hashCandidate = crypto.createHash('sha256').update(candidate).digest();
  const hashSecret = crypto.createHash('sha256').update(secret).digest();
  return crypto.timingSafeEqual(hashCandidate, hashSecret);
}

export function isAuthorized(req: NextRequest): { authorized: boolean; reason?: string } {
  const adminKey = process.env.ADMIN_KEY;
  // Fail-closed if server secret is unconfigured
  if (!adminKey || adminKey.trim() === '') {
    return { authorized: false, reason: 'ADMIN_KEY_NOT_CONFIGURED' };
  }

  const rawHeader = req.headers.get('authorization') || '';
  const match = rawHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { authorized: false, reason: 'MISSING_BEARER_TOKEN' };
  }

  const candidateKey = match[1].trim();
  const valid = timingSafeCompare(candidateKey, adminKey);
  return { authorized: valid };
}

/**
 * Validates magic bytes of an uploaded image buffer to ensure it is genuinely
 * a JPEG, PNG, WebP, GIF, or AVIF file, preventing disguised executables/polyglots.
 */
export function isValidImageBuffer(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // WebP: 'RIFF' .... 'WEBP'
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  // GIF: GIF87a or GIF89a ('GIF8')
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return true;
  }

  // AVIF: ....ftypavif or ftyp
  const boxType = buffer.slice(4, 12).toString('ascii');
  if (boxType.startsWith('ftyp')) {
    return true;
  }

  return false;
}

/**
 * Sanitizes an uploaded filename to prevent directory traversal or control characters.
 */
export function sanitizeFilename(rawName: string): string {
  const base = rawName.replace(/^.*[\\\/]/, '').trim();
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  return sanitized || `upload-${Date.now()}.webp`;
}

/**
 * Strict SSRF check against loopback, private networks, cloud metadata, and non-standard ports.
 */
export function isSafeExternalUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;

  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // Disallow non-standard ports (e.g. 22, 25, 6379, 11211, 27017)
    if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    // Loopback hostnames
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '[::1]'
    ) {
      return false;
    }

    // Prohibited internal domain suffixes
    const prohibitedSuffixes = [
      '.internal',
      '.local',
      '.corp',
      '.home',
      '.lan',
      '.localdomain',
      '.arpa',
    ];
    if (prohibitedSuffixes.some((s) => host.endsWith(s))) {
      return false;
    }

    // Cloud metadata hostnames
    if (host === 'metadata.google.internal' || host === 'instance-data') {
      return false;
    }

    // Check if host is an IPv4 address
    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const p1 = parseInt(ipv4Match[1], 10);
      const p2 = parseInt(ipv4Match[2], 10);

      // 127.0.0.0/8 (Loopback)
      if (p1 === 127) return false;
      // 0.0.0.0/8 (Current network)
      if (p1 === 0) return false;
      // 10.0.0.0/8 (Private)
      if (p1 === 10) return false;
      // 172.16.0.0/12 (Private: 172.16 - 172.31)
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return false;
      // 192.168.0.0/16 (Private)
      if (p1 === 192 && p2 === 168) return false;
      // 169.254.0.0/16 (Link-local & cloud metadata 169.254.169.254)
      if (p1 === 169 && p2 === 254) return false;
      // 100.64.0.0/10 (Carrier NAT)
      if (p1 === 100 && p2 >= 64 && p2 <= 127) return false;
    }

    // Check for decimal representations of IP (e.g. 2130706433 = 127.0.0.1)
    if (/^\d+$/.test(host)) {
      return false;
    }

    // Check for hex representations of IP (e.g. 0x7f000001)
    if (/^0x[0-9a-f]+$/i.test(host)) {
      return false;
    }

    // IPv6 private or link-local checks
    if (host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
