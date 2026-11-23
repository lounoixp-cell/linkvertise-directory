import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPaginatedPosts, getAllSortedPosts, POSTS_PER_PAGE } from '@/lib/posts';
import PostGrid from '@/components/PostGrid';
import Pagination from '@/components/Pagination';

export const revalidate = 60;

interface PageProps {
  params: {
    pageNumber: string;
  };
}

export async function generateStaticParams() {
  const allPosts = await getAllSortedPosts();
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE) || 1;
  const params = [];
  for (let i = 2; i <= totalPages; i++) {
    params.push({ pageNumber: i.toString() });
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!/^\d+$/.test(params.pageNumber)) {
    return { title: 'Page Not Found — xoohub' };
  }
  const pageNum = Number(params.pageNumber);
  return {
    title: `xoohub — Page ${pageNum}`,
    description: `Page ${pageNum} of xoohub.`,
    alternates: {
      canonical: pageNum === 1 ? '/' : `/page/${pageNum}`,
    },
  };
}

export default async function PaginatedListPage({ params }: PageProps) {
  if (!/^\d+$/.test(params.pageNumber)) {
    notFound();
  }

  const pageNum = Number(params.pageNumber);

  if (pageNum < 1) {
    notFound();
  }

  if (pageNum === 1) {
    redirect('/');
  }

  const { items, totalPages, currentPage } = await getPaginatedPosts(pageNum);

  if (pageNum > totalPages && totalPages > 0) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PostGrid posts={items} />
      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="" />
    </div>
  );
}
