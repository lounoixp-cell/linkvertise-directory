import { NextRequest, NextResponse } from 'next/server';
import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  recordSuccessfulAttempt,
  isAuthorized,
  isValidImageBuffer,
  sanitizeFilename,
  SECURITY_HEADERS,
} from '@/lib/adminAuth';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zj5cuk1g';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiToken = process.env.SANITY_API_TOKEN;

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
    return NextResponse.json(
      { error: 'Unauthorized: Invalid passcode.' },
      { status: 401, headers: SECURITY_HEADERS }
    );
  }

  recordSuccessfulAttempt(ip);

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
        { error: 'Uploaded file must be a valid image MIME type.' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Deep inspection: verify magic bytes to ensure file is an authentic image
    if (!isValidImageBuffer(buffer)) {
      return NextResponse.json(
        { error: 'Invalid image format: file contents do not match authentic image signatures.' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const safeFilename = sanitizeFilename(file.name || 'upload.webp');

    const sanityRes = await fetch(
      `https://${projectId}.api.sanity.io/v2024-11-01/assets/images/${dataset}?filename=${encodeURIComponent(safeFilename)}`,
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
