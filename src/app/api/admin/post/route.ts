import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zj5cuk1g';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiToken = process.env.SANITY_API_TOKEN;
const adminKey = process.env.ADMIN_KEY || 'xoohub2026';

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
  const urlKey = req.nextUrl.searchParams.get('key');
  return authHeader === adminKey || urlKey === adminKey;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    return NextResponse.json(data.result || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, externalUrl, previewImage, description, sortOrder } = body;

    if (!title || !externalUrl || !previewImage) {
      return NextResponse.json(
        { error: 'Title, External URL, and Preview Image are required.' },
        { status: 400 }
      );
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
      previewImage: previewImage.trim(),
      externalUrl: externalUrl.trim(),
      publishedAt: new Date().toISOString(),
      status: 'active',
      sortOrder: Number(sortOrder) || 1,
      description: description ? description.trim() : undefined,
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
        { status: 400 }
      );
    }

    revalidateTag('post');
    revalidatePath('/');
    revalidatePath(`/post/${slugCurrent}`);

    return NextResponse.json({ success: true, document: result.results?.[0]?.document });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create post' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, slug } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Document ID is required.' }, { status: 400 });
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
    if (slug) {
      revalidatePath(`/post/${slug}`);
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete post' }, { status: 500 });
  }
}
