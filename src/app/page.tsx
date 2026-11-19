import { getPaginatedPosts } from '@/lib/posts';
import PostGrid from '@/components/PostGrid';
import Pagination from '@/components/Pagination';

export const revalidate = 60; // 60s cache revalidation

export default async function HomePage() {
  const { items, totalPages, currentPage } = await getPaginatedPosts(1);

  return (
    <div className="space-y-8">
      <PostGrid posts={items} />
      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="" />
    </div>
  );
}
