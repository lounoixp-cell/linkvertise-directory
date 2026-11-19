import { createClient, type QueryParams } from 'next-sanity';

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-11-01';

export const isSanityConfigured = Boolean(projectId && projectId.trim() !== '');

export const client = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: process.env.NODE_ENV === 'production',
    })
  : null;

export async function sanityFetch<T>({
  query,
  params = {},
  revalidate = 60,
  tags = ['post'],
}: {
  query: string;
  params?: QueryParams;
  revalidate?: number | false;
  tags?: string[];
}): Promise<T> {
  if (!client) {
    throw new Error('Sanity client is not configured: missing NEXT_PUBLIC_SANITY_PROJECT_ID');
  }

  return client.fetch<T>(query, params, {
    next: {
      revalidate,
      tags,
    },
  });
}
