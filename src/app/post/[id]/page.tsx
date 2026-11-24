import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon, Video } from 'lucide-react';
import { getPostByIdOrSlug, getAdjacentPosts, getAllSortedPosts } from '@/lib/posts';
import ExternalLinkButton from '@/components/ExternalLinkButton';
import PostNavigation from '@/components/PostNavigation';
import Slideshow from '@/components/Slideshow';

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
      title: 'Post Not Found — xoohub',
    };
  }

  return {
    title: `${post.title} — xoohub`,
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
        {/* Slideshow or Single Preview Image with ambient backdrop & anti-download protection */}
        <div className="mb-6">
          <Slideshow
            images={
              post.gallery && post.gallery.length > 0
                ? post.gallery
                : post.previewImage
                ? [post.previewImage]
                : []
            }
            alt={post.previewImageAlt || post.title}
            priority
          />
        </div>

        {/* Post Title */}
        <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
          {post.title}
        </h1>

        {/* Media Counts if provided in CMS */}
        {((post.imageCount && String(post.imageCount).trim()) || (post.videoCount && String(post.videoCount).trim())) && (
          <div className="mt-3 flex items-center gap-2.5 flex-wrap">
            {post.imageCount && String(post.imageCount).trim() && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-800/80 px-3 py-1 text-xs font-semibold text-neutral-200 border border-neutral-700/60 shadow-sm">
                <ImageIcon className="h-4 w-4 text-red-400" />
                <span>{String(post.imageCount).trim()} Photos</span>
              </span>
            )}
            {post.videoCount && String(post.videoCount).trim() && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-800/80 px-3 py-1 text-xs font-semibold text-neutral-200 border border-neutral-700/60 shadow-sm">
                <Video className="h-4 w-4 text-red-400" />
                <span>{String(post.videoCount).trim()} Videos</span>
              </span>
            )}
          </div>
        )}

        {/* By ADMIN / Author line */}
        <div className="mt-3 text-xs sm:text-sm font-medium text-neutral-400">
          By <span className="text-red-500 font-bold uppercase">ADMIN</span>
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
