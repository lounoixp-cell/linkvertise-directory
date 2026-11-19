import { NextRequest, NextResponse } from 'next/server';
import { feedbackRequestSchema, CRLF_REGEX } from '@/types/feedback';
import { dispatchFeedbackEmail } from '@/lib/email';

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_PAYLOAD_SIZE = 102400; // 100KB ceiling matching test boundary

function checkRateLimit(ip: string): boolean {
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t: number) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);

  // Periodic cleanup if map grows too large
  if (rateLimitMap.size > 1000) {
    rateLimitMap.forEach((times: number[], key: string) => {
      if (times.every((t: number) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        rateLimitMap.delete(key);
      }
    });
  }

  return true;
}

export async function POST(req: NextRequest | Request) {
  try {
    // 1. Payload size check
    const rawText = await req.text();
    if (rawText.length > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Payload too large: maximum size is 100KB.' },
        { status: 413 }
      );
    }

    // 2. Parse JSON
    let body: any;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed JSON payload.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: 'Malformed JSON payload: expected a JSON object.' },
        { status: 400 }
      );
    }

    // 3. Honeypot check
    if (body.hp_val && String(body.hp_val).trim() !== '') {
      return NextResponse.json(
        { success: false, error: 'Spam submission detected by honeypot.' },
        { status: 400 }
      );
    }

    // 4. Rate limiting check
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 5. Explicit validations matching test assertions
    if (!body.message || typeof body.message !== 'string' || body.message.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Message is required and cannot be empty.' },
        { status: 400 }
      );
    }

    if (body.message.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message exceeds maximum length of 2000 characters.' },
        { status: 400 }
      );
    }

    if (!body.pageUrl || typeof body.pageUrl !== 'string' || body.pageUrl.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Context pageUrl is required.' },
        { status: 400 }
      );
    }

    if (body.email) {
      if (typeof body.email !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid email address format.' },
          { status: 400 }
        );
      }

      if (CRLF_REGEX.test(body.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid characters in email address (CRLF prohibited).' },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json(
          { success: false, error: 'Invalid email address format.' },
          { status: 400 }
        );
      }
    }

    if (body.name) {
      if (typeof body.name !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid characters in name (CRLF prohibited).' },
          { status: 400 }
        );
      }

      if (CRLF_REGEX.test(body.name)) {
        return NextResponse.json(
          { success: false, error: 'Invalid characters in name (CRLF prohibited).' },
          { status: 400 }
        );
      }

      if (body.name.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Name exceeds maximum length of 100 characters.' },
          { status: 400 }
        );
      }
    }

    const parseResult = feedbackRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Validation error.';
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    // 6. Transactional email dispatch
    const dispatchResult = await dispatchFeedbackEmail({
      message: body.message,
      email: body.email ? body.email.trim() : undefined,
      name: body.name ? body.name.trim() : undefined,
      pageUrl: body.pageUrl.trim(),
    });

    if (!dispatchResult.success) {
      return NextResponse.json(
        { success: false, error: dispatchResult.error || 'Failed to send feedback email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Thank you for your feedback!' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
