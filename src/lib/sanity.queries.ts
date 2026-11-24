import { groq } from 'next-sanity';

/**
 * Paginated posts query with deterministic ordering:
 * order(sortOrder asc, publishedAt desc, _id asc)
 * Returns both items in the page slice and total count of published posts.
 */
export const paginatedPostsQuery = groq`{
  "items": *[_type == "post" && !(_id in path("drafts.**")) && status == "active" && defined(slug.current)]
    | order(sortOrder asc, publishedAt desc, _id asc) [$start...$end] {
      _id,
      title,
      "slug": slug.current,
      tag,
      "previewImage": select(
        defined(previewImage.asset) => previewImage {
          asset-> {
            _id,
            url,
            metadata {
              dimensions { width, height, aspectRatio },
              lqip
            }
          },
          alt,
          hotspot,
          crop
        },
        previewImage
      ),
      externalUrl,
      publishedAt,
      status,
      sortOrder,
      description,
      imageCount,
      videoCount,
      "gallery": select(
        defined(gallery[0].asset) => gallery[].asset->url,
        defined(gallery) => gallery,
        []
      )
    },
  "totalItems": count(*[_type == "post" && !(_id in path("drafts.**")) && status == "active" && defined(slug.current)])
}`;

/**
 * Single post detail query by slug
 */
export const postBySlugQuery = groq`*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
  _id,
  title,
  "slug": slug.current,
  tag,
  "previewImage": select(
    defined(previewImage.asset) => previewImage {
      asset-> {
        _id,
        url,
        metadata {
          dimensions { width, height, aspectRatio },
          lqip
        }
      },
      alt,
      hotspot,
      crop
    },
    previewImage
  ),
  externalUrl,
  publishedAt,
  status,
  sortOrder,
  description,
  imageCount,
  videoCount,
  "gallery": select(
    defined(gallery[0].asset) => gallery[].asset->url,
    defined(gallery) => gallery,
    []
  )
}`;

/**
 * Adjacent posts query matching deterministic sequence:
 * Retrieves current post and the complete ordered list of active posts
 * to compute exact Previous and Next neighbors without sequence drift.
 */
export const adjacentPostsQuery = groq`{
  "post": *[_type == "post" && (slug.current == $slug || _id == $slug) && !(_id in path("drafts.**"))][0] {
    _id,
    title,
    "slug": slug.current,
    tag,
    "previewImage": select(
      defined(previewImage.asset) => previewImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions { width, height, aspectRatio },
            lqip
          }
        },
        alt,
        hotspot,
        crop
      },
      previewImage
    ),
    externalUrl,
    publishedAt,
    status,
    sortOrder,
    description,
    imageCount,
    videoCount,
    "gallery": select(
      defined(gallery[0].asset) => gallery[].asset->url,
      defined(gallery) => gallery,
      []
    )
  },
  "indexList": *[_type == "post" && !(_id in path("drafts.**")) && status == "active" && defined(slug.current)]
    | order(sortOrder asc, publishedAt desc, _id asc) {
      _id,
      title,
      "slug": slug.current,
      tag,
      previewImage,
      externalUrl,
      publishedAt,
      status,
      sortOrder,
      description
    }
}`;

/**
 * All sorted active posts query for static generation and fallback index
 */
export const allSortedPostsQuery = groq`*[_type == "post" && !(_id in path("drafts.**")) && status == "active" && defined(slug.current)]
  | order(sortOrder asc, publishedAt desc, _id asc) {
    _id,
    title,
    "slug": slug.current,
    tag,
    "previewImage": select(
      defined(previewImage.asset) => previewImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions { width, height, aspectRatio },
            lqip
          }
        },
        alt,
        hotspot,
        crop
      },
      previewImage
    ),
    externalUrl,
    publishedAt,
    status,
    sortOrder,
    description,
    imageCount,
    videoCount
  }`;
