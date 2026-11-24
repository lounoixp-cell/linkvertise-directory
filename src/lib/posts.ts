import { Post, PaginatedResult } from '@/types/post';
import { isSanityConfigured, sanityFetch } from './sanity.client';
import { urlForImage, getImageUrl } from './sanity.image';
import {
  paginatedPostsQuery,
  postBySlugQuery,
  adjacentPostsQuery,
  allSortedPostsQuery,
} from './sanity.queries';

export const POSTS_PER_PAGE = 8;

export const DEMO_POSTS: Post[] = [
  {
    id: "101",
    slug: "serena-noir-exclusive-gallery",
    title: "Serena Noir — Midnight Studio Sessions Vol. 1",
    tag: "Photoset",
    category: "Photoset",
    tags: ["Studio", "Lingerie", "High-Fashion", "Portrait"],
    previewImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Serena Noir — Midnight Studio Sessions Vol. 1",
    externalUrl: "https://linkvertise.com/demo/serena-noir-vol1",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-18T18:30:00Z",
    status: "active",
    sortOrder: 1,
    description: "Full resolution 4K portrait and fashion studio collection captured under natural low-key lighting."
  },
  {
    id: "102",
    slug: "elena-frost-cyberpunk-cosplay",
    title: "Elena Frost — Neo-Tokyo Cyberpunk Cosplay",
    tag: "Cosplay",
    category: "Cosplay",
    tags: ["Cyberpunk", "Cosplay", "Neon", "Sci-Fi"],
    previewImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Elena Frost — Neo-Tokyo Cyberpunk Cosplay",
    externalUrl: "https://linkvertise.com/demo/elena-frost-neo",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-18T16:00:00Z",
    status: "active",
    sortOrder: 2,
    description: "Elaborate handcrafted costume featuring custom acrylic LED props, cinematic smoke, and Tokyo neon backdrops."
  },
  {
    id: "103",
    slug: "aurora-blake-sunset-beachside",
    title: "Aurora Blake — Golden Hour Malibu Shores",
    tag: "Photoset",
    category: "Photoset",
    tags: ["Beach", "Swimwear", "Golden Hour", "Outdoors"],
    previewImage: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Aurora Blake — Golden Hour Malibu Shores",
    externalUrl: "https://linkvertise.com/demo/aurora-blake-malibu",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-18T13:45:00Z",
    status: "active",
    sortOrder: 3,
    description: "Sun-drenched seaside aesthetic captured during summer solstice on 35mm film."
  },
  {
    id: "104",
    slug: "chloe-vance-vintage-motel-series",
    title: "Chloe Vance — Route 66 Retro Americana",
    tag: "Photoset",
    category: "Photoset",
    tags: ["Vintage", "Retro", "Americana", "Film"],
    previewImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Chloe Vance — Route 66 Retro Americana",
    externalUrl: "https://linkvertise.com/demo/chloe-vance-retro",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-18T11:15:00Z",
    status: "active",
    sortOrder: 4,
    description: "1970s styled cinematic shoot set in an authentic Mojave Desert roadside motel."
  },
  {
    id: "105",
    slug: "mila-k-fitness-lifestyle",
    title: "Mila K — Athletic Sculpt & Activewear",
    tag: "Fitness",
    category: "Fitness",
    tags: ["Athletic", "Fitness", "Activewear", "Gym"],
    previewImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Mila K — Athletic Sculpt & Activewear",
    externalUrl: "https://linkvertise.com/demo/mila-k-athletic",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-17T20:00:00Z",
    status: "active",
    sortOrder: 5,
    description: "High-intensity athletic physique photography showcasing performance apparel lines."
  },
  {
    id: "106",
    slug: "valerie-lux-gothic-boudoir",
    title: "Valerie Lux — Crimson Velvet & Noir Lace",
    tag: "Photoset",
    category: "Photoset",
    tags: ["Gothic", "Boudoir", "Dark Aesthetic", "Mood"],
    previewImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Valerie Lux — Crimson Velvet & Noir Lace",
    externalUrl: "https://linkvertise.com/demo/valerie-lux-crimson",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-17T17:30:00Z",
    status: "active",
    sortOrder: 6,
    description: "Deep shadows, velvet upholstery, and vintage Victorian lace accents in a 19th century townhouse."
  },
  {
    id: "107",
    slug: "jade-ling-urban-rooftop-session",
    title: "Jade Ling — Skyline Dusk & Glass Horizons",
    tag: "Urban",
    category: "Urban",
    tags: ["Rooftop", "Cityscape", "Fashion", "Twilight"],
    previewImage: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Jade Ling — Skyline Dusk & Glass Horizons",
    externalUrl: "https://linkvertise.com/demo/jade-ling-skyline",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-17T14:10:00Z",
    status: "active",
    sortOrder: 7,
    description: "Modern minimalist fashion set high above the metropolis during blue hour."
  },
  {
    id: "108",
    slug: "maya-stewart-candid-apartment-vlog",
    title: "Maya Stewart — Sunday Morning Chill & BTS Vlog",
    tag: "Video",
    category: "Video",
    tags: ["Vlog", "BTS", "Casual", "Coffee"],
    previewImage: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Maya Stewart — Sunday Morning Chill & BTS Vlog",
    externalUrl: "https://linkvertise.com/demo/maya-stewart-bts",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-17T10:00:00Z",
    status: "active",
    sortOrder: 8,
    description: "Relaxed 4K vlog exploring routine, wardrobe selections, and behind-the-scenes shoot preparation."
  },
  {
    id: "109",
    slug: "scarlett-reid-monochrome-shadows",
    title: "Scarlett Reid — Black & White Silhouette Studies",
    tag: "Photoset",
    category: "Photoset",
    tags: ["Monochrome", "Fine Art", "Minimal", "Lighting"],
    previewImage: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Scarlett Reid — Black & White Silhouette Studies",
    externalUrl: "https://linkvertise.com/demo/scarlett-reid-bw",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-16T22:00:00Z",
    status: "active",
    sortOrder: 9,
    description: "Pure contrast study exploring form, architectural lighting geometry, and medium-format grain."
  },
  {
    id: "110",
    slug: "sora-takahashi-neon-district",
    title: "Sora Takahashi — Shibuya After Hours",
    tag: "Cosplay",
    category: "Cosplay",
    tags: ["Tokyo", "Streetwear", "Night", "Cyber"],
    previewImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Sora Takahashi — Shibuya After Hours",
    externalUrl: "https://linkvertise.com/demo/sora-takahashi-shibuya",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-16T18:40:00Z",
    status: "active",
    sortOrder: 10,
    description: "Futuristic street styling shot on rainy avenues reflecting giant digital billboards."
  },
  {
    id: "111",
    slug: "tessa-claire-greenhouse-botanical",
    title: "Tessa Claire — Botanical Conservatory Flora",
    tag: "Photoset",
    category: "Photoset",
    tags: ["Nature", "Botanical", "Natural Light", "Earthy"],
    previewImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Tessa Claire — Botanical Conservatory Flora",
    externalUrl: "https://linkvertise.com/demo/tessa-claire-flora",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-16T15:20:00Z",
    status: "active",
    sortOrder: 11,
    description: "Surrounded by lush monstera leaves, ferns, and soft diffused glasshouse sunlight."
  },
  {
    id: "112",
    slug: "zara-devon-rooftop-poolside",
    title: "Zara Devon — Palm Springs Modernist Escape",
    tag: "Photoset",
    category: "Photoset",
    tags: ["Poolside", "Resort", "Sun", "Desert"],
    previewImage: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Zara Devon — Palm Springs Modernist Escape",
    externalUrl: "https://linkvertise.com/demo/zara-devon-pool",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-16T12:00:00Z",
    status: "active",
    sortOrder: 12,
    description: "Mid-century architecture, turquoise water reflections, and effortless vacation styling."
  },
  {
    id: "113",
    slug: "katerina-v-silk-and-stone",
    title: "Katerina V — Classical Villa Marble & Silk",
    tag: "Photoset",
    category: "Photoset",
    tags: ["Classical", "Elegance", "Architecture", "Luxury"],
    previewImage: "https://images.unsplash.com/photo-1514315384763-ba401779410f?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Katerina V — Classical Villa Marble & Silk",
    externalUrl: "https://linkvertise.com/demo/katerina-v-villa",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-15T19:00:00Z",
    status: "active",
    sortOrder: 13,
    description: "Italian renaissance inspired editorial featuring flowing draped silks in historic courtyard cloisters."
  },
  {
    id: "114",
    slug: "layla-brooks-night-drive-cinematics",
    title: "Layla Brooks — Midnight Highway 101 Drive",
    tag: "Video",
    category: "Video",
    tags: ["Night Drive", "Cinematic", "Moody", "Neon"],
    previewImage: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Layla Brooks — Midnight Highway 101 Drive",
    externalUrl: "https://linkvertise.com/demo/layla-brooks-highway",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-15T16:15:00Z",
    status: "active",
    sortOrder: 14,
    description: "Atmospheric dashboard reflections, highway streetlamp streaks, and lo-fi soundtrack."
  },
  {
    id: "115",
    slug: "ariana-cross-cozy-cabin-autumn",
    title: "Ariana Cross — Fireside Warmth & Knitwear",
    tag: "Photoset",
    category: "Photoset",
    tags: ["Cozy", "Autumn", "Cabin", "Warm"],
    previewImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Ariana Cross — Fireside Warmth & Knitwear",
    externalUrl: "https://linkvertise.com/demo/ariana-cross-cabin",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-15T11:00:00Z",
    status: "active",
    sortOrder: 15,
    description: "Wood-burning hearth, chunky knit sweaters, and mountain timber cabin scenery."
  },
  {
    id: "116",
    slug: "nadia-sol-desert-dune-wanderer",
    title: "Nadia Sol — Sahara Wind & Golden Sands",
    tag: "Photoset",
    category: "Photoset",
    tags: ["Desert", "Dunes", "Adventure", "Landscape"],
    previewImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    previewImageAlt: "Nadia Sol — Sahara Wind & Golden Sands",
    externalUrl: "https://linkvertise.com/demo/nadia-sol-desert",
    destinationDomain: "linkvertise.com",
    publishedAt: "2024-11-14T21:30:00Z",
    status: "active",
    sortOrder: 16,
    description: "Dramatic wind-sculpted sand dunes and flowing desert fabrics captured at sunrise."
  }
];

interface SanityPostItem {
  _id: string;
  title: string;
  slug: string;
  tag?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previewImage?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gallery?: any[];
  externalUrl: string;
  publishedAt: string;
  status: 'active' | 'archived';
  sortOrder: number;
  description?: string;
  imageCount?: string | number;
  videoCount?: string | number;
}

function extractDomain(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return 'linkvertise.com';
  }
}

function mapSanityPostToPost(doc: SanityPostItem): Post {
  let imageUrl = 'https://placehold.co/800x500/18181b/71717a?text=Preview+Image';
  if (typeof doc.previewImage === 'string' && doc.previewImage.trim() !== '') {
    imageUrl = doc.previewImage.trim();
  } else if (doc.previewImage?.asset?.url) {
    imageUrl = doc.previewImage.asset.url;
  } else if (doc.previewImage) {
    const resolved = getImageUrl(doc.previewImage);
    if (resolved) {
      imageUrl = resolved;
    } else {
      const generated = urlForImage(doc.previewImage)?.url();
      if (generated) imageUrl = generated;
    }
  }

  const tag = doc.tag || 'General';

  const rawGallery = Array.isArray(doc.gallery) ? doc.gallery : [];
  const gallery: string[] = [];
  for (const item of rawGallery) {
    if (typeof item === 'string' && item.trim()) {
      gallery.push(item.trim());
    } else if (item?.asset?.url) {
      gallery.push(item.asset.url);
    } else if (item?.url) {
      gallery.push(item.url);
    }
  }

  // Ensure primary image is included if gallery is provided
  const finalGallery = gallery.length > 0
    ? (gallery.includes(imageUrl) ? gallery : [imageUrl, ...gallery])
    : (imageUrl ? [imageUrl] : []);

  return {
    id: doc._id,
    slug: doc.slug,
    title: doc.title,
    tag,
    previewImage: imageUrl,
    previewImageAlt: doc.previewImage?.alt || (typeof doc.previewImage === 'object' ? doc.previewImage?.alt : undefined) || `${doc.title} preview image`,
    gallery: finalGallery,
    imageCount: doc.imageCount !== undefined && doc.imageCount !== null && String(doc.imageCount).trim() !== '' ? doc.imageCount : undefined,
    videoCount: doc.videoCount !== undefined && doc.videoCount !== null && String(doc.videoCount).trim() !== '' ? doc.videoCount : undefined,
    externalUrl: doc.externalUrl,
    destinationDomain: extractDomain(doc.externalUrl),
    publishedAt: doc.publishedAt,
    status: doc.status || 'active',
    sortOrder: typeof doc.sortOrder === 'number' ? doc.sortOrder : 100,
    description: doc.description,
    category: tag,
    tags: [tag],
  };
}

/**
 * Deterministic total ordering:
 * 1. sortOrder ascending (1, 2, 3...)
 * 2. publishedAt descending (latest first)
 * 3. id ascending (tie-breaker)
 */
export function sortPostsDeterministically(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const orderA = typeof a.sortOrder === 'number' && !Number.isNaN(a.sortOrder) ? a.sortOrder : 100;
    const orderB = typeof b.sortOrder === 'number' && !Number.isNaN(b.sortOrder) ? b.sortOrder : 100;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const rawTimeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const rawTimeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    const timeA = Number.isNaN(rawTimeA) ? 0 : rawTimeA;
    const timeB = Number.isNaN(rawTimeB) ? 0 : rawTimeB;
    const dateDiff = timeB - timeA;
    if (dateDiff !== 0) {
      return dateDiff;
    }
    const idA = a.id || '';
    const idB = b.id || '';
    return idA.localeCompare(idB);
  });
}

/**
 * Retrieve all sorted posts (Sanity with graceful fallback to DEMO_POSTS)
 */
export async function getAllSortedPosts(): Promise<Post[]> {
  if (isSanityConfigured) {
    try {
      const docs = await sanityFetch<SanityPostItem[]>({
        query: allSortedPostsQuery,
        tags: ['post'],
        revalidate: 60,
      });
      if (Array.isArray(docs)) {
        return docs.map(mapSanityPostToPost);
      }
    } catch (err) {
      console.warn('Sanity fetch failed in getAllSortedPosts:', err);
      return [];
    }
  }

  const activePosts = DEMO_POSTS.filter((p) => p.status === 'active');
  return sortPostsDeterministically(activePosts);
}

/**
 * Retrieve paginated posts (Sanity with graceful fallback to DEMO_POSTS when unconfigured)
 */
export async function getPaginatedPosts(
  page: number = 1,
  pageSize: number = POSTS_PER_PAGE
): Promise<PaginatedResult<Post>> {
  const safePage = Math.max(1, Math.floor(Number(page)) || 1);
  const safePageSize = Math.max(1, Math.floor(Number(pageSize)) || POSTS_PER_PAGE);

  if (isSanityConfigured) {
    try {
      const start = Math.max(0, (safePage - 1) * safePageSize);
      const end = start + safePageSize;
      const result = await sanityFetch<{ items: SanityPostItem[]; totalItems: number }>({
        query: paginatedPostsQuery,
        params: { start, end },
        tags: ['post'],
        revalidate: 60,
      });

      if (result && Array.isArray(result.items)) {
        const items = result.items.map(mapSanityPostToPost);
        const totalItems = result.totalItems || 0;
        const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));

        return {
          items,
          totalItems,
          currentPage: safePage,
          totalPages,
          pageSize: safePageSize,
          hasNextPage: safePage < totalPages,
          hasPrevPage: safePage > 1,
        };
      }
    } catch (err) {
      console.warn('Sanity fetch failed in getPaginatedPosts:', err);
      return {
        items: [],
        totalItems: 0,
        currentPage: safePage,
        totalPages: 1,
        pageSize: safePageSize,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }
  }

  const activePosts = DEMO_POSTS.filter((p) => p.status === 'active');
  const allPosts = sortPostsDeterministically(activePosts);
  const totalItems = allPosts.length;
  const totalPages = Math.ceil(totalItems / safePageSize) || 1;
  const startIndex = (safePage - 1) * safePageSize;
  const items = allPosts.slice(startIndex, startIndex + safePageSize);

  return {
    items,
    totalItems,
    currentPage: safePage,
    totalPages,
    pageSize: safePageSize,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}

/**
 * Retrieve single post by slug (Sanity with fallback to DEMO_POSTS when unconfigured)
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (isSanityConfigured) {
    try {
      const doc = await sanityFetch<SanityPostItem | null>({
        query: postBySlugQuery,
        params: { slug },
        tags: ['post'],
        revalidate: 60,
      });
      if (doc) {
        return mapSanityPostToPost(doc);
      }
      return null;
    } catch (err) {
      console.warn('Sanity fetch failed in getPostBySlug:', err);
      return null;
    }
  }

  const found = DEMO_POSTS.find((p) => p.slug === slug || p.id === slug);
  return found || null;
}

/**
 * Backward compatibility alias for existing routes prior to Milestone 2
 */
export async function getPostByIdOrSlug(identifier: string): Promise<Post | null> {
  return getPostBySlug(identifier);
}

/**
 * Adjacent post navigation matching homepage sort order
 */
export async function getAdjacentPosts(currentSlug: string): Promise<{
  prevPost: Post | null;
  nextPost: Post | null;
}> {
  if (isSanityConfigured) {
    try {
      const data = await sanityFetch<{
        post: SanityPostItem | null;
        indexList: Array<{
          _id: string;
          title: string;
          slug: string;
          tag?: string;
          previewImage?: unknown;
          externalUrl: string;
          publishedAt: string;
          status: 'active' | 'archived';
          sortOrder: number;
          description?: string;
        }>;
      }>({
        query: adjacentPostsQuery,
        params: { slug: currentSlug },
        tags: ['post'],
        revalidate: 60,
      });

      if (data?.indexList && data.indexList.length > 0) {
        const list = data.indexList;
        const currentIndex = list.findIndex(
          (p) => p.slug === currentSlug || p._id === currentSlug
        );

        if (currentIndex !== -1) {
          const prevRaw = currentIndex > 0 ? list[currentIndex - 1] : null;
          const nextRaw = currentIndex < list.length - 1 ? list[currentIndex + 1] : null;

          return {
            prevPost: prevRaw ? mapSanityPostToPost(prevRaw as SanityPostItem) : null,
            nextPost: nextRaw ? mapSanityPostToPost(nextRaw as SanityPostItem) : null,
          };
        }

        return { prevPost: null, nextPost: null };
      }
      return { prevPost: null, nextPost: null };
    } catch (err) {
      console.warn('Sanity fetch failed in getAdjacentPosts:', err);
      return { prevPost: null, nextPost: null };
    }
  }

  const activePosts = DEMO_POSTS.filter((p) => p.status === 'active');
  const allPosts = sortPostsDeterministically(activePosts);
  const currentIndex = allPosts.findIndex(
    (p) => p.slug === currentSlug || p.id === currentSlug
  );

  if (currentIndex === -1) {
    return { prevPost: null, nextPost: null };
  }

  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  return { prevPost, nextPost };
}
