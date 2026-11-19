import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ImageOff } from 'lucide-react';
import { getPostByIdOrSlug, getAdjacentPosts, getAllSortedPosts } from '@/lib/posts';
import ExternalLinkButton from '@/components/ExternalLinkButton';
import PostNavigation from '@/components/PostNavigation';

interface PostPageProps {
  params: {
    id: string;
  };
}

export async function generateStaticParams() {
  const allPosts = await getAllSortedPosts();
  return allPosts.flatMap((post) => [
    { id: post.id },
    { id: post.slug },
  ]);
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = await getPostByIdOrSlug(params.id);

  if (!post) {
    return {
      title: 'Post Not Found — Linkvertise Directory',
    };
  }

  return {
    title: `${post.title} — Linkvertise Directory`,
    description: post.description || `View external access and details for ${post.title}.`,
    openGraph: {
      title: post.title,
      description: post.description,
      images: post.previewImage ? [post.previewImage] : [],
    },
  };
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const post = await getPostByIdOrSlug(params.id);

  if (!post) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center" role="alert">
        <h1 className="text-2xl font-bold text-white">Post not found.</h1>
        <p className="mt-2 text-sm text-neutral-400">
          The requested link listing could not be found or has been removed.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            data-action="back"
            className="inline-block px-4 py-2 border border-neutral-700 text-sm font-medium text-white rounded hover:bg-neutral-800 transition-colors"
          >
            [ Back ]
          </Link>
        </div>
      </main>
    );
  }

  const { prevPost, nextPost } = await getAdjacentPosts(post.slug);
  const parsedDate = post.publishedAt ? new Date(post.publishedAt) : null;
  const formattedDate = parsedDate && !isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently published';

  return (
    <main className="mx-auto max-w-4xl space-y-8">
      {/* Top Breadcrumb / Back Navigation */}
      <nav className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>&larr; Back to directory</span>
        </Link>
      </nav>

      {/* Main Post Container */}
      <article className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl backdrop-blur-sm">
        {/* Preview Image maintaining aspect ratio */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-neutral-950">
          {post.previewImage ? (
            <Image
              src={post.previewImage}
              alt={post.previewImageAlt || post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 896px"
              priority
              className="object-cover"
            />
          ) : (
            <div
              data-fallback="placeholder"
              className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-neutral-950 text-neutral-600"
            >
              <ImageOff className="h-8 w-8 text-neutral-600" aria-hidden="true" />
              <span className="text-xs font-medium">Image Preview Unavailable</span>
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-neutral-400 font-semibold tracking-wider">
              {post.tag || post.category}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
            {post.title}
          </h1>

          <time dateTime={post.publishedAt} className="text-xs text-neutral-500 block">
            Published {formattedDate}
          </time>

          {post.description && (
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed pt-2">
              {post.description}
            </p>
          )}

          {/* External Link Action Container */}
          <div data-component="external-link-button" className="pt-6 border-t border-neutral-800">
            <ExternalLinkButton
              externalUrl={post.externalUrl}
              destinationDomain={post.destinationDomain}
              postTitle={post.title}
            />
          </div>
        </div>
      </article>

      {/* Previous / Next Post Navigation */}
      <PostNavigation prevPost={prevPost} nextPost={nextPost} />
    </main>
  );
}
