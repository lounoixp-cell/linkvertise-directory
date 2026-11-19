import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Post } from '@/types/post';

interface PostNavigationProps {
  prevPost: Post | null;
  nextPost: Post | null;
}

function formatDateSafely(dateStr?: string | null): string {
  if (!dateStr || dateStr.trim() === '') return 'Recently published';
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return 'Recently published';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function PostNavigation({ prevPost, nextPost }: PostNavigationProps) {
  if (!prevPost && !nextPost) return null;

  return (
    <nav
      aria-label="Post navigation"
      className="mt-10 border-t border-neutral-800 pt-8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Previous Post */}
        {prevPost ? (
          <Link
            href={`/post/${prevPost.slug || prevPost.id}`}
            data-nav="prev"
            data-active="prev"
            className="group flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-900 text-left"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 group-hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4 shrink-0 -ml-1 text-neutral-400 group-hover:text-white" />
              <span>&larr; PREVIOUS</span>
            </div>
            <span className="mt-1.5 text-sm sm:text-base font-bold text-neutral-200 group-hover:text-white line-clamp-1">
              &laquo; {prevPost.title}
            </span>
            <span className="mt-1 text-xs text-neutral-500">
              {(prevPost.tag || prevPost.category || 'General').toUpperCase()} &bull; {formatDateSafely(prevPost.publishedAt)}
            </span>
          </Link>
        ) : (
          <div
            data-nav="prev-disabled"
            data-disabled="prev"
            aria-disabled="true"
            className="flex flex-col rounded-xl border border-neutral-900/40 bg-neutral-950/40 p-4 opacity-40 select-none text-left cursor-not-allowed"
          >
            <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-600">
              <ChevronLeft className="h-4 w-4 shrink-0 -ml-1" />
              <span>PREVIOUS</span>
            </div>
            <span className="mt-1.5 text-sm font-medium text-neutral-600">
              No previous post
            </span>
          </div>
        )}

        {/* Next Post */}
        {nextPost ? (
          <Link
            href={`/post/${nextPost.slug || nextPost.id}`}
            data-nav="next"
            data-active="next"
            className="group flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-900 text-left sm:text-right"
          >
            <div className="flex items-center justify-start sm:justify-end gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 group-hover:text-white transition-colors">
              <span>NEXT &rarr;</span>
              <ChevronRight className="h-4 w-4 shrink-0 -mr-1 text-neutral-400 group-hover:text-white" />
            </div>
            <span className="mt-1.5 text-sm sm:text-base font-bold text-neutral-200 group-hover:text-white line-clamp-1">
              {nextPost.title} &raquo;
            </span>
            <span className="mt-1 text-xs text-neutral-500">
              {(nextPost.tag || nextPost.category || 'General').toUpperCase()} &bull; {formatDateSafely(nextPost.publishedAt)}
            </span>
          </Link>
        ) : (
          <div
            data-nav="next-disabled"
            data-disabled="next"
            aria-disabled="true"
            className="flex flex-col rounded-xl border border-neutral-900/40 bg-neutral-950/40 p-4 opacity-40 select-none text-left sm:text-right cursor-not-allowed"
          >
            <div className="flex items-center justify-start sm:justify-end gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-600">
              <span>NEXT</span>
              <ChevronRight className="h-4 w-4 shrink-0 -mr-1" />
            </div>
            <span className="mt-1.5 text-sm font-medium text-neutral-600">
              No next post
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
