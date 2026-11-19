import { Post } from '@/types/post';
import PostCard from './PostCard';

interface PostGridProps {
  posts: Post[];
}

export default function PostGrid({ posts }: PostGridProps) {
  if (!posts || posts.length === 0) {
    return (
      <div
        role="status"
        className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 p-8 text-center"
      >
        <h3 className="text-lg font-semibold text-neutral-300">No posts available.</h3>
        <p className="mt-1 text-sm text-neutral-500">There are currently no active listings in this section.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} priority={index < 4} />
      ))}
    </div>
  );
}
