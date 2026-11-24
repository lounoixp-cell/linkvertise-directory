import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zj5cuk1g';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiToken = process.env.SANITY_API_TOKEN;
const adminKey = process.env.ADMIN_KEY;

const SECURITY_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};

function timingSafeCompare(candidate: string, secret: string): boolean {
  if (!candidate || !secret) return false;
  const hashCandidate = crypto.createHash('sha256').update(candidate).digest();
  const hashSecret = crypto.createHash('sha256').update(secret).digest();
  return crypto.timingSafeEqual(hashCandidate, hashSecret);
}

function isAuthorized(req: NextRequest): boolean {
  if (!adminKey || adminKey.trim() === '') return false;
  const rawHeader = req.headers.get('authorization') || '';
  const match = rawHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  return timingSafeCompare(match[1].trim(), adminKey);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid passcode.' },
      { status: 401, headers: SECURITY_HEADERS }
    );
  }

  if (!apiToken) {
    return NextResponse.json(
      { error: 'Server misconfiguration: SANITY_API_TOKEN is not configured.' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file uploaded.' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Max 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit (10MB).' },
        { status: 413, headers: SECURITY_HEADERS }
      );
    }

    const contentType = file.type || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Uploaded file must be a valid image.' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const filename = file.name || 'upload.jpg';
    const buffer = Buffer.from(await file.arrayBuffer());

    const sanityRes = await fetch(
      `https://${projectId}.api.sanity.io/v2024-11-01/assets/images/${dataset}?filename=${encodeURIComponent(filename)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          Authorization: `Bearer ${apiToken}`,
        },
        body: buffer,
      }
    );

    const data = await sanityRes.json();

    if (data.document?.url) {
      return NextResponse.json(
        {
          success: true,
          url: data.document.url,
          assetId: data.document._id,
        },
        { headers: SECURITY_HEADERS }
      );
    }

    return NextResponse.json(
      { error: data.error?.message || 'Failed to upload asset to Sanity CDN.' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Image upload failed.' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
