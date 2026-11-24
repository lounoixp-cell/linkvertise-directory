'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
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

  // Touch Swipe Handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45; // pixels

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
        className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-600"
      >
        <ImageOff className="h-8 w-8 text-neutral-600" aria-hidden="true" />
        <span className="text-xs font-medium">Image Preview Unavailable</span>
      </div>
    );
  }

  // Single Image Mode (No controls needed)
  if (total === 1) {
    return (
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-neutral-950">
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
    <div
      className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-neutral-950 select-none group"
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
        const isAdjacent = Math.abs(index - currentIndex) === 1 || (currentIndex === 0 && index === total - 1) || (currentIndex === total - 1 && index === 0);
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

      {/* Prev Navigation Button */}
      <button
        type="button"
        onClick={goToPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-black/85 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Next Navigation Button */}
      <button
        type="button"
        onClick={goToNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-black/85 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Top-Right Counter Pill */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 px-2.5 py-1 text-xs font-semibold text-neutral-200">
        <span>{currentIndex + 1}</span>
        <span className="text-neutral-500">/</span>
        <span className="text-neutral-400">{total}</span>
      </div>

      {/* Bottom Center Indicator Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-1 border border-white/10">
        {images.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === currentIndex
                ? 'w-6 bg-red-500'
                : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
