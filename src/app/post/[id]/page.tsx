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

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      {/* Top Breadcrumb / Back Navigation */}
      <nav className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to directory</span>
        </Link>
      </nav>

      {/* Main Post Container */}
      <article className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
        {/* Preview Image maintaining aspect ratio */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-neutral-950 mb-6">
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

        {/* Post Title */}
        <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
          {post.title}
        </h1>

        {/* By ADMIN / Author line */}
        <div className="mt-2 text-xs sm:text-sm font-medium text-neutral-400">
          By <span className="text-red-500 font-bold uppercase">{post.tag || 'ADMIN'}</span>
        </div>

        {/* Direct Link */}
        <div data-component="external-link-button" className="mt-4">
          <ExternalLinkButton
            externalUrl={post.externalUrl}
            destinationDomain={post.destinationDomain}
            postTitle={post.title}
          />
        </div>

        {/* Previous / Next Post Navigation matching screenshot */}
        <PostNavigation prevPost={prevPost} nextPost={nextPost} />
      </article>
    </main>
  );
}
