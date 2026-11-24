'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';

interface ProtectedImageProps extends Omit<ImageProps, 'draggable'> {
  containerClassName?: string;
  blurBackdrop?: boolean;
}

export default function ProtectedImage({
  containerClassName = '',
  alt,
  className = '',
  blurBackdrop = true,
  ...imageProps
}: ProtectedImageProps) {
  const handleBlockAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
    <div
      data-protected="image"
      className={`relative w-full h-full select-none overflow-hidden bg-neutral-950 ${containerClassName}`}
      onContextMenu={handleBlockAction}
      onDragStart={handleBlockAction}
      onCopy={handleBlockAction}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      {/* 
        Layer 1: Blurred Ambient Backdrop
        Fills the letterbox/pillarbox areas with the natural color palette of the image,
        preventing any awkward black bars and creating a luxury gallery feel.
      */}
      {blurBackdrop && imageProps.src && (
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <Image
            src={imageProps.src}
            alt=""
            aria-hidden="true"
            fill
            unoptimized
            draggable={false}
            className="scale-125 object-cover filter blur-2xl opacity-60 brightness-75 select-none transition-all duration-300"
          />
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
        </div>
      )}

      {/* 
        Layer 2: Crisp, Full Uncropped Image
        Uses object-contain so that 100% of the image (portraits, squares, landscapes)
        is completely visible in the center without being cropped.
      */}
      <Image
        alt={alt}
        draggable={false}
        unoptimized
        className={`relative z-[2] pointer-events-none select-none object-contain h-full w-full transition-transform duration-300 ${className}`}
        {...imageProps}
      />

      {/* 
        Layer 3: Transparent Security Overlay Shield
        Catches all mouse and touch interactions above the image.
      */}
      <div
        aria-hidden="true"
        onContextMenu={handleBlockAction}
        onDragStart={handleBlockAction}
        onCopy={handleBlockAction}
        className="absolute inset-0 z-10 cursor-pointer bg-transparent select-none pointer-events-auto"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      />
    </div>
  );
}
