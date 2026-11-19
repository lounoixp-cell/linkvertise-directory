import Link from 'next/link';
import { Post } from '@/types/post';

interface PostNavigationProps {
  prevPost: Post | null;
  nextPost: Post | null;
}

export default function PostNavigation({ prevPost, nextPost }: PostNavigationProps) {
  if (!prevPost && !nextPost) return null;

  return (
    <nav
      aria-label="Post navigation"
      className="mt-6 border-t border-neutral-800/80 pt-6"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Previous Post */}
        <div className="text-left flex-1 min-w-0">
          <span className="text-xs text-neutral-400 block mb-1">Previous</span>
          {prevPost ? (
            <Link
              href={`/post/${prevPost.slug || prevPost.id}`}
              data-nav="prev"
              className="text-sm sm:text-base font-semibold text-red-500 hover:text-red-400 hover:underline line-clamp-1 inline-block"
            >
              &laquo; {prevPost.title}
            </Link>
          ) : (
            <span
              data-nav="prev-disabled"
              className="text-sm text-neutral-600 select-none block"
            >
              &laquo; None
            </span>
          )}
        </div>

        {/* Next Post */}
        <div className="text-right sm:text-right flex-1 min-w-0">
          <span className="text-xs text-neutral-400 block mb-1">Next</span>
          {nextPost ? (
            <Link
              href={`/post/${nextPost.slug || nextPost.id}`}
              data-nav="next"
              className="text-sm sm:text-base font-semibold text-red-500 hover:text-red-400 hover:underline line-clamp-1 inline-block"
            >
              {nextPost.title} &raquo;
            </Link>
          ) : (
            <span
              data-nav="next-disabled"
              className="text-sm text-neutral-600 select-none block"
            >
              None &raquo;
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
