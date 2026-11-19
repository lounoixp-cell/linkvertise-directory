import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-500 mb-4">
        <FileQuestion className="h-8 w-8 text-neutral-500" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-white">Post not found.</h1>

      <p className="mt-2 text-sm text-neutral-400 max-w-md">
        The requested link listing could not be found or has been removed.
      </p>

      <div className="mt-6">
        <Link
          href="/"
          data-action="back"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-neutral-700 transition-colors"
        >
          <span>[ Back ]</span>
        </Link>
      </div>
    </div>
  );
}
