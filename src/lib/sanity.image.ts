import { createImageUrlBuilder } from '@sanity/image-url';
import { client, isSanityConfigured, projectId, dataset } from './sanity.client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const builder = isSanityConfigured && client
  ? createImageUrlBuilder({ projectId, dataset })
  : null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function urlForImage(source: any) {
  if (!builder || !source) {
    return null;
  }
  if (typeof source === 'string') {
    return null;
  }
  if (!source?.asset) {
    return null;
  }
  return builder.image(source).auto('format').fit('max');
}

/**
 * Safe image URL resolver supporting raw string URLs, direct asset URLs,
 * and Sanity image records with asset references.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getImageUrl(source: any): string | null {
  if (!source) {
    return null;
  }

  // Raw string URL
  if (typeof source === 'string') {
    const trimmed = source.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  // Pre-resolved asset url from GROQ expansion (asset-> { url })
  if (typeof source?.asset?.url === 'string' && source.asset.url.trim() !== '') {
    return source.asset.url.trim();
  }

  // Sanity image asset object or reference
  if (source?.asset && builder) {
    try {
      const generated = builder.image(source).auto('format').fit('max').url();
      return generated || null;
    } catch {
      return null;
    }
  }

  return null;
}

