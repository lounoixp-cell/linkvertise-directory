import { revalidateTag, revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

const SECURITY_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};

type WebhookPayload = {
  _type: string;
  slug?: { current?: string } | string;
};

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SANITY_REVALIDATE_SECRET;
    if (!secret) {
      return NextResponse.json(
        { message: 'Missing SANITY_REVALIDATE_SECRET environment variable' },
        { status: 500, headers: SECURITY_HEADERS }
      );
    }

    const { isValidSignature, body } = await parseBody<WebhookPayload>(
      req,
      secret,
      true // waitForContentLakeEventualConsistency
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { message: 'Invalid webhook signature' },
        { status: 401, headers: SECURITY_HEADERS }
      );
    }

    if (!body?._type) {
      return NextResponse.json(
        { message: 'Bad request: missing document type in body' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Trigger cache revalidation
    revalidateTag(body._type);
    revalidatePath('/');
    revalidatePath('/page/[pageNumber]', 'page');

    const slug = typeof body.slug === 'string' ? body.slug : body.slug?.current;
    if (slug) {
      revalidatePath(`/post/${slug}`);
    }

    return NextResponse.json(
      {
        revalidated: true,
        type: body._type,
        slug: slug || null,
        timestamp: new Date().toISOString(),
      },
      { headers: SECURITY_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during revalidation';
    return NextResponse.json({ message }, { status: 500, headers: SECURITY_HEADERS });
  }
}
