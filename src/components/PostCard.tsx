'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight, Image as ImageIcon, Video, ImageOff, Layers } from 'lucide-react';
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imgError, setImgError] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const formattedDate = formatDateSafely(post.publishedAt);
  const postSlug = post.slug || post.id;
  const altText = post.previewImageAlt || post.title;

  // Media counters
  const rawImg = post.imageCount !== undefined && post.imageCount !== null ? String(post.imageCount).trim() : '';
  const rawVid = post.videoCount !== undefined && post.videoCount !== null ? String(post.videoCount).trim() : '';
  const hasImageCount = rawImg.length > 0;
  const hasVideoCount = rawVid.length > 0;

  // Resolve gallery images
  const images: string[] =
    post.gallery && post.gallery.length > 0
      ? post.gallery
      : post.previewImage
      ? [post.previewImage]
      : [];

  const total = images.length;
  const hasSlideshow = total > 1;

  const goToPrev = useCallback(
    (e?: React.MouseEvent | React.TouchEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (total <= 1) return;
      setCurrentSlide((prev) => (prev - 1 + total) % total);
    },
    [total]
  );

  const goToNext = useCallback(
    (e?: React.MouseEvent | React.TouchEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (total <= 1) return;
      setCurrentSlide((prev) => (prev + 1) % total);
    },
    [total]
  );

  const goToSlide = useCallback(
    (idx: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentSlide(idx);
    },
    []
  );

  // Mobile Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasSlideshow) return;
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!hasSlideshow || touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;

    // Trigger horizontal swipe only if deltaX is distinct and mostly horizontal
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <article
      data-component="post-card"
      className="group/card relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/70 transition-all duration-200 hover:-translate-y-1 hover:border-neutral-700 hover:bg-neutral-900 hover:shadow-xl hover:shadow-black/50 focus-within:ring-2 focus-within:ring-neutral-400"
    >
      {/* Media / Slideshow Container */}
      <div
        className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Full Image Area Link: Navigates to Post details when clicked */}
        <Link
          href={`/post/${postSlug}`}
          className="absolute inset-0 z-0 block focus:outline-none"
          aria-label={`View details for ${post.title}`}
        >
          {!imgError && total > 0 ? (
            hasSlideshow ? (
              images.map((src, idx) => {
                const isActive = idx === currentSlide;
                const isAdjacent =
                  Math.abs(idx - currentSlide) === 1 ||
                  (currentSlide === 0 && idx === total - 1) ||
                  (currentSlide === total - 1 && idx === 0);
                const shouldRender = isActive || isAdjacent;

                if (!shouldRender) return null;

                return (
                  <div
                    key={src + idx}
                    className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                      isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                    aria-hidden={!isActive}
                  >
                    <ProtectedImage
                      src={src}
                      alt={`${altText} — Slide ${idx + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      priority={priority && idx === 0}
                      className="transition-transform duration-300 group-hover/card:scale-105"
                      onError={() => setImgError(true)}
                    />
                  </div>
                );
              })
            ) : (
              <ProtectedImage
                src={images[0]}
                alt={altText}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                priority={priority}
                className="transition-transform duration-300 group-hover/card:scale-105"
                onError={() => setImgError(true)}
              />
            )
          ) : (
            <div
              data-fallback="placeholder"
              className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-neutral-950 text-neutral-600"
            >
              <ImageOff className="h-8 w-8 text-neutral-600" aria-hidden="true" />
              <span className="text-xs font-medium">Image Preview Unavailable</span>
            </div>
          )}
        </Link>

        {/* Slideshow Controls (Rendered as siblings to Link, eliminating invalid DOM nesting) */}
        {hasSlideshow && (
          <>
            {/* Top-Right Dynamic Counter Badge */}
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-lg pointer-events-none">
              <Layers className="h-3 w-3 text-red-400" />
              <span>
                {currentSlide + 1} / {total}
              </span>
            </div>

            {/* Prev Chevron Button */}
            <button
              type="button"
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur-md border border-white/20 shadow-lg transition-all duration-200 hover:bg-red-600 hover:border-red-500 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 opacity-90 sm:opacity-0 sm:group-hover/card:opacity-100 hover:!opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Next Chevron Button */}
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur-md border border-white/20 shadow-lg transition-all duration-200 hover:bg-red-600 hover:border-red-500 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 opacity-90 sm:opacity-0 sm:group-hover/card:opacity-100 hover:!opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Bottom-Center Indicator Dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-1 border border-white/15 shadow-md">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => goToSlide(idx, e)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === currentSlide
                      ? 'w-4 bg-red-500 shadow-sm shadow-red-500/50'
                      : 'w-1.5 bg-white/40 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <Link
            href={`/post/${postSlug}`}
            className="group/title focus:outline-none"
            aria-label={`Read ${post.title}`}
          >
            <h2 className="text-sm font-bold text-neutral-100 group-hover/title:text-red-400 group-hover/card:text-neutral-200 line-clamp-2 break-words transition-colors leading-snug">
              {post.title}
            </h2>
          </Link>

          {/* Media Counters (Image & Video icons + counts) if configured in CMS */}
          {(hasImageCount || hasVideoCount) && (
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              {hasImageCount && (
                <span className="inline-flex items-center gap-1 rounded-md bg-neutral-800/80 px-2 py-0.5 text-[11px] font-semibold text-neutral-300 border border-neutral-700/50 shadow-sm">
                  <ImageIcon className="h-3 w-3 text-red-400 shrink-0" />
                  <span>{rawImg}</span>
                </span>
              )}
              {hasVideoCount && (
                <span className="inline-flex items-center gap-1 rounded-md bg-neutral-800/80 px-2 py-0.5 text-[11px] font-semibold text-neutral-300 border border-neutral-700/50 shadow-sm">
                  <Video className="h-3 w-3 text-red-400 shrink-0" />
                  <span>{rawVid}</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
          <time dateTime={post.publishedAt} className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-neutral-500" />
            {formattedDate}
          </time>
          <Link
            href={`/post/${postSlug}`}
            className="text-xs font-semibold text-neutral-400 group-hover/card:text-white group-hover/card:translate-x-0.5 transition-all focus:outline-none"
          >
            View Post &rarr;
          </Link>
        </div>
      </div>
    </article>
  );
}
