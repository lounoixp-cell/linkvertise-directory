'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Layers } from 'lucide-react';
import ProtectedImage from '@/components/ProtectedImage';

interface SlideshowProps {
  images: string[];
  alt: string;
  priority?: boolean;
}

export default function Slideshow({ images, alt, priority = false }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const total = images.length;

  const goToNext = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goToPrev = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Keyboard navigation (Left / Right arrow keys)
  useEffect(() => {
    if (total <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, total]);

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40; // pixels

    if (diff > minSwipeDistance) {
      goToNext(); // Swipe left -> Next
    } else if (diff < -minSwipeDistance) {
      goToPrev(); // Swipe right -> Prev
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // If no images provided
  if (!images || images.length === 0) {
    return (
      <div
        data-fallback="placeholder"
        className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-600"
      >
        <ImageOff className="h-8 w-8 text-neutral-600" aria-hidden="true" />
        <span className="text-xs font-medium">Image Preview Unavailable</span>
      </div>
    );
  }

  // Single Image Mode (No controls needed)
  if (total === 1) {
    return (
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-xl bg-neutral-950">
        <ProtectedImage
          src={images[0]}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 896px"
          priority={priority}
        />
      </div>
    );
  }

  // Multi-Image Slideshow Mode
  return (
    <div className="space-y-3">
      {/* Main Slideshow Container */}
      <div
        className="relative aspect-[4/3] sm:aspect-[16/10] max-h-[620px] w-full overflow-hidden rounded-xl bg-neutral-950 select-none group border border-neutral-800/80 shadow-2xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-roledescription="carousel"
        aria-label={`${alt} gallery`}
      >
        {/* Slides Container */}
        {images.map((src, index) => {
          const isActive = index === currentIndex;
          // Preload adjacent images for instantaneous zero-latency navigation
          const isAdjacent =
            Math.abs(index - currentIndex) === 1 ||
            (currentIndex === 0 && index === total - 1) ||
            (currentIndex === total - 1 && index === 0);
          const shouldRender = isActive || isAdjacent;

          if (!shouldRender) return null;

          return (
            <div
              key={src + index}
              className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
              aria-hidden={!isActive}
            >
              <ProtectedImage
                src={src}
                alt={`${alt} — Photo ${index + 1} of ${total}`}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                priority={index === 0 && priority}
              />
            </div>
          );
        })}

        {/* Click Zones for Image: Left 35% goes Prev, Right 35% goes Next */}
        <div
          role="button"
          tabIndex={0}
          onClick={goToPrev}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') goToPrev();
          }}
          className="absolute inset-y-0 left-0 w-[35%] z-20 cursor-w-resize"
          title="Click to view previous photo"
          aria-label="Previous photo"
        />
        <div
          role="button"
          tabIndex={0}
          onClick={goToNext}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') goToNext();
          }}
          className="absolute inset-y-0 right-0 w-[35%] z-20 cursor-e-resize"
          title="Click to view next photo"
          aria-label="Next photo"
        />

        {/* Always-Visible Prev Navigation Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-200 hover:bg-red-600 hover:border-red-500 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Always-Visible Next Navigation Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-200 hover:bg-red-600 hover:border-red-500 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Top-Right Counter Badge */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-bold text-white shadow-lg">
          <Layers className="h-3.5 w-3.5 text-red-400" />
          <span>
            {currentIndex + 1} / {total}
          </span>
        </div>

        {/* Bottom Center Indicator Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 border border-white/15 shadow-lg">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-2.5 rounded-full transition-all duration-200 ${
                idx === currentIndex
                  ? 'w-7 bg-red-500 shadow-sm shadow-red-500/50'
                  : 'w-2.5 bg-white/40 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Interactive Thumbnail Strip underneath */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
        {images.map((src, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={src + idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`group relative h-16 w-20 sm:h-20 sm:w-24 shrink-0 overflow-hidden rounded-lg border transition-all duration-200 ${
                isActive
                  ? 'border-red-500 ring-2 ring-red-500/80 scale-[1.02] shadow-lg shadow-red-950/40'
                  : 'border-neutral-800 opacity-60 hover:opacity-100 hover:border-neutral-600'
              }`}
              aria-label={`View photo ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[9px] font-mono text-white">
                #{idx + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
