'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Calendar, ImageOff } from 'lucide-react';
import { Post } from '@/types/post';
import ProtectedImage from '@/components/ProtectedImage';

interface PostCardProps {
  post: Post;
  priority?: boolean;
}

function formatDateSafely(dateStr?: string | null): string {
  if (!dateStr || dateStr.trim() === '') return 'Recently published';
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return 'Recently published';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PostCard({ post, priority = false }: PostCardProps) {
  const [imgError, setImgError] = useState(false);

  const formattedDate = formatDateSafely(post.publishedAt);
  const tagDisplay = (post.tag || post.category || 'General').trim();
  const postSlug = post.slug || post.id;
  const altText = post.previewImageAlt || post.title;

  return (
    <article
      data-component="post-card"
      className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/70 transition-all duration-200 hover:-translate-y-1 hover:border-neutral-700 hover:bg-neutral-900 hover:shadow-xl hover:shadow-black/50 focus-within:ring-2 focus-within:ring-neutral-400"
    >
      <Link
        href={`/post/${postSlug}`}
        className="flex flex-col h-full focus:outline-none"
        aria-label={`View details for ${post.title}`}
      >
        {/* Preview Image with 16:10 aspect ratio and anti-download protection */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950">
          {!imgError && post.previewImage ? (
            <ProtectedImage
              src={post.previewImage}
              alt={altText}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              priority={priority}
              className="transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
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

          {/* Uppercase Tag Pill */}
          <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
            <span className="inline-flex items-center gap-1 rounded bg-black/75 px-2 py-0.5 text-[11px] font-semibold text-neutral-200 backdrop-blur-sm border border-white/10 uppercase">
              {tagDisplay}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <h2 className="text-sm font-bold text-neutral-100 group-hover:text-neutral-300 line-clamp-2 break-words transition-colors leading-snug">
              {post.title}
            </h2>

            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-neutral-400">
              <ExternalLink className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
              <span className="truncate max-w-[200px]" title={post.destinationDomain}>
                Destination: <span className="text-neutral-300 font-medium">{post.destinationDomain}</span>
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
            <time dateTime={post.publishedAt} className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-neutral-500" />
              {formattedDate}
            </time>
            <span className="text-xs font-semibold text-neutral-400 group-hover:text-neutral-200 group-hover:translate-x-0.5 transition-all">
              View Post &rarr;
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
