import { revalidateTag, revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

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
        { status: 500 }
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
        { status: 401 }
      );
    }

    if (!body?._type) {
      return NextResponse.json(
        { message: 'Bad request: missing document type in body' },
        { status: 400 }
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

    return NextResponse.json({
      revalidated: true,
      type: body._type,
      slug: slug || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during revalidation';
    return NextResponse.json({ message }, { status: 500 });
  }
}
