import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import crypto from 'crypto';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zj5cuk1g';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiToken = process.env.SANITY_API_TOKEN;
const adminKey = process.env.ADMIN_KEY;

// Security response headers for administrative endpoints
const SECURITY_HEADERS = {
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

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remainingSec: number } {
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

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = authAttempts.get(ip) || { attempts: 0, lockedUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  authAttempts.set(ip, record);

  // Prevent memory leaks
  if (authAttempts.size > 2000) {
    authAttempts.forEach((val, key) => {
      if (val.lockedUntil <= now) authAttempts.delete(key);
    });
  }
}

function recordSuccessfulAttempt(ip: string) {
  authAttempts.delete(ip);
}

/**
 * Constant-time hash comparison to prevent timing attack side-channel leaks (CWE-208)
 */
function timingSafeCompare(candidate: string, secret: string): boolean {
  if (!candidate || !secret) return false;
  const hashCandidate = crypto.createHash('sha256').update(candidate).digest();
  const hashSecret = crypto.createHash('sha256').update(secret).digest();
  return crypto.timingSafeEqual(hashCandidate, hashSecret);
}

function isAuthorized(req: NextRequest): { authorized: boolean; reason?: string } {
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

function isSafeExternalUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    // Prevent SSRF against loopback, metadata services, and internal nets
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      hostname === '169.254.169.254'
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function resolveDirectImageUrl(inputUrl: string): Promise<string> {
  const trimmed = inputUrl.trim();
  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();

    // ImgBB sharing page (e.g., https://ibb.co/0VvjNd0G)
    if (hostname === 'ibb.co' || hostname.endsWith('.ibb.co')) {
      if (hostname !== 'i.ibb.co') {
        const pageRes = await fetch(trimmed, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; xoohub/1.0)' },
          signal: AbortSignal.timeout(4000),
        }).catch(() => null);

        if (pageRes && pageRes.ok) {
          const html = await pageRes.text();
          const match = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
      }
    }

    // Imgur page without file extension (e.g., https://imgur.com/abc1234)
    if ((hostname === 'imgur.com' || hostname === 'www.imgur.com') && !parsed.pathname.includes('.')) {
      const id = parsed.pathname.replace(/^\//, '');
      if (id) {
        return `https://i.imgur.com/${id}.jpg`;
      }
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many failed attempts. Access locked for ${rateLimit.remainingSec}s.` },
      { status: 429, headers: { ...SECURITY_HEADERS, 'Retry-After': String(rateLimit.remainingSec) } }
    );
  }

  const auth = isAuthorized(req);
  if (!auth.authorized) {
    recordFailedAttempt(ip);
    if (auth.reason === 'ADMIN_KEY_NOT_CONFIGURED') {
      return NextResponse.json(
        { error: 'Server misconfiguration: ADMIN_KEY is not set.' },
        { status: 500, headers: SECURITY_HEADERS }
      );
    }
    return NextResponse.json({ error: 'Unauthorized: Invalid passcode.' }, { status: 401, headers: SECURITY_HEADERS });
  }

  recordSuccessfulAttempt(ip);

  try {
    const query = encodeURIComponent('*[_type == "post"] | order(sortOrder asc, publishedAt desc)');
    const res = await fetch(
      `https://${projectId}.api.sanity.io/v2024-11-01/data/query/${dataset}?query=${query}`,
      {
        headers: apiToken ? { Authorization: `Bearer ${apiToken}` } : {},
        cache: 'no-store',
      }
    );

    const data = await res.json();
    return NextResponse.json(data.result || [], { headers: SECURITY_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch posts' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many failed attempts. Access locked for ${rateLimit.remainingSec}s.` },
      { status: 429, headers: { ...SECURITY_HEADERS, 'Retry-After': String(rateLimit.remainingSec) } }
    );
  }

  const auth = isAuthorized(req);
  if (!auth.authorized) {
    recordFailedAttempt(ip);
    if (auth.reason === 'ADMIN_KEY_NOT_CONFIGURED') {
      return NextResponse.json(
        { error: 'Server misconfiguration: ADMIN_KEY is not set.' },
        { status: 500, headers: SECURITY_HEADERS }
      );
    }
    return NextResponse.json({ error: 'Unauthorized: Invalid passcode.' }, { status: 401, headers: SECURITY_HEADERS });
  }

  recordSuccessfulAttempt(ip);

  try {
    const body = await req.json();
    const { title, externalUrl, previewImage, description, sortOrder, gallery } = body;

    // Strict input validation
    if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
      return NextResponse.json(
        { error: 'Title is required (maximum 200 characters).' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    if (!externalUrl || typeof externalUrl !== 'string' || !isSafeExternalUrl(externalUrl.trim())) {
      return NextResponse.json(
        { error: 'A valid HTTP/HTTPS external URL is required.' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    if (!previewImage || typeof previewImage !== 'string' || !isSafeExternalUrl(previewImage.trim())) {
      return NextResponse.json(
        { error: 'A valid HTTP/HTTPS image URL is required.' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const safeSortOrder = Math.max(1, Math.min(999999, Math.floor(Number(sortOrder)) || 1));

    // Automatically resolve sharing pages (e.g. ibb.co/XYZ) to direct image URLs
    const resolvedImage = await resolveDirectImageUrl(previewImage);

    // Resolve any gallery images
    let resolvedGallery: string[] | undefined = undefined;
    if (Array.isArray(gallery) && gallery.length > 0) {
      resolvedGallery = [];
      for (const item of gallery) {
        if (typeof item === 'string' && isSafeExternalUrl(item.trim())) {
          const resolved = await resolveDirectImageUrl(item.trim());
          if (resolved && !resolvedGallery.includes(resolved)) {
            resolvedGallery.push(resolved);
          }
        }
      }
    }

    const slugCurrent = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newDoc = {
      _type: 'post',
      title: title.trim(),
      slug: {
        _type: 'slug',
        current: slugCurrent || `post-${Date.now()}`,
      },
      previewImage: resolvedImage,
      gallery: resolvedGallery && resolvedGallery.length > 0 ? resolvedGallery : undefined,
      externalUrl: externalUrl.trim(),
      publishedAt: new Date().toISOString(),
      status: 'active',
      sortOrder: safeSortOrder,
      description: description && typeof description === 'string' ? description.trim().slice(0, 1000) : undefined,
    };

    const res = await fetch(
      `https://${projectId}.api.sanity.io/v2024-11-01/data/mutate/${dataset}?returnDocuments=true`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ mutations: [{ create: newDoc }] }),
      }
    );

    const result = await res.json();

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || 'Sanity mutation error' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    revalidateTag('post');
    revalidatePath('/');
    revalidatePath(`/post/${slugCurrent}`);

    return NextResponse.json(
      { success: true, document: result.results?.[0]?.document },
      { headers: SECURITY_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create post' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}

export async function PUT(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many failed attempts. Access locked for ${rateLimit.remainingSec}s.` },
      { status: 429, headers: { ...SECURITY_HEADERS, 'Retry-After': String(rateLimit.remainingSec) } }
    );
  }

  const auth = isAuthorized(req);
  if (!auth.authorized) {
    recordFailedAttempt(ip);
    if (auth.reason === 'ADMIN_KEY_NOT_CONFIGURED') {
      return NextResponse.json(
        { error: 'Server misconfiguration: ADMIN_KEY is not set.' },
        { status: 500, headers: SECURITY_HEADERS }
      );
    }
    return NextResponse.json({ error: 'Unauthorized: Invalid passcode.' }, { status: 401, headers: SECURITY_HEADERS });
  }

  recordSuccessfulAttempt(ip);

  try {
    const body = await req.json();
    const { id, slug, title, externalUrl, previewImage, description, sortOrder, gallery } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Valid document ID is required for updating.' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
      return NextResponse.json(
        { error: 'Title is required (maximum 200 characters).' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    if (!externalUrl || typeof externalUrl !== 'string' || !isSafeExternalUrl(externalUrl.trim())) {
      return NextResponse.json(
        { error: 'A valid HTTP/HTTPS external URL is required.' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    if (!previewImage || typeof previewImage !== 'string' || !isSafeExternalUrl(previewImage.trim())) {
      return NextResponse.json(
        { error: 'A valid HTTP/HTTPS image URL is required.' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const safeSortOrder = Math.max(1, Math.min(999999, Math.floor(Number(sortOrder)) || 1));
    const resolvedImage = await resolveDirectImageUrl(previewImage);

    let resolvedGallery: string[] | undefined = undefined;
    if (Array.isArray(gallery) && gallery.length > 0) {
      resolvedGallery = [];
      for (const item of gallery) {
        if (typeof item === 'string' && isSafeExternalUrl(item.trim())) {
          const resolved = await resolveDirectImageUrl(item.trim());
          if (resolved && !resolvedGallery.includes(resolved)) {
            resolvedGallery.push(resolved);
          }
        }
      }
    }

    const setFields: Record<string, any> = {
      title: title.trim(),
      previewImage: resolvedImage,
      gallery: resolvedGallery && resolvedGallery.length > 0 ? resolvedGallery : [],
      externalUrl: externalUrl.trim(),
      sortOrder: safeSortOrder,
      description: description && typeof description === 'string' ? description.trim().slice(0, 1000) : '',
    };

    const res = await fetch(
      `https://${projectId}.api.sanity.io/v2024-11-01/data/mutate/${dataset}?returnDocuments=true`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          mutations: [
            {
              patch: {
                id,
                set: setFields,
              },
            },
          ],
        }),
      }
    );

    const result = await res.json();

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || 'Sanity mutation error' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    revalidateTag('post');
    revalidatePath('/');
    if (slug && typeof slug === 'string') {
      revalidatePath(`/post/${slug}`);
    }

    return NextResponse.json(
      { success: true, document: result.results?.[0]?.document },
      { headers: SECURITY_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update post' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many failed attempts. Access locked for ${rateLimit.remainingSec}s.` },
      { status: 429, headers: { ...SECURITY_HEADERS, 'Retry-After': String(rateLimit.remainingSec) } }
    );
  }

  const auth = isAuthorized(req);
  if (!auth.authorized) {
    recordFailedAttempt(ip);
    if (auth.reason === 'ADMIN_KEY_NOT_CONFIGURED') {
      return NextResponse.json(
        { error: 'Server misconfiguration: ADMIN_KEY is not set.' },
        { status: 500, headers: SECURITY_HEADERS }
      );
    }
    return NextResponse.json({ error: 'Unauthorized: Invalid passcode.' }, { status: 401, headers: SECURITY_HEADERS });
  }

  recordSuccessfulAttempt(ip);

  try {
    const { id, slug } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Valid document ID is required.' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const res = await fetch(
      `https://${projectId}.api.sanity.io/v2024-11-01/data/mutate/${dataset}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ mutations: [{ delete: { id } }] }),
      }
    );

    const result = await res.json();

    revalidateTag('post');
    revalidatePath('/');
    if (slug && typeof slug === 'string') {
      revalidatePath(`/post/${slug}`);
    }

    return NextResponse.json({ success: true, result }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete post' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
