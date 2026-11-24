'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';
import { triggerSecurityShield } from './SecurityShield';

interface ProtectedImageProps extends Omit<ImageProps, 'draggable'> {
  containerClassName?: string;
}

export default function ProtectedImage({
  containerClassName = '',
  alt,
  className = '',
  ...imageProps
}: ProtectedImageProps) {
  const handleBlockAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerSecurityShield('This file is secured. Right-click downloading is prohibited.');
    return false;
  };

  return (
    <div
      data-protected="image"
      className={`relative w-full h-full select-none overflow-hidden ${containerClassName}`}
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
        Native Next.js Image:
        - draggable={false}
        - pointer-events-none to prevent direct click/drag/right-click targeting
      */}
      <Image
        alt={alt}
        draggable={false}
        unoptimized
        className={`pointer-events-none select-none object-cover ${className}`}
        {...imageProps}
      />

      {/* 
        Transparent Security Overlay Shield:
        - Catches all mouse and touch interactions above the image.
        - Prevents mobile browsers (iOS Safari, Android Chrome) from detecting 
          the <img> element on tap-and-hold for the "Save to Photos" dialog.
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
