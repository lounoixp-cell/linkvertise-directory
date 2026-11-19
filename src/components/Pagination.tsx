import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageUrl = (pageNumber: number) => {
    if (pageNumber <= 1) {
      return basePath ? `${basePath}` : '/';
    }
    return `${basePath}/page/${pageNumber}`;
  };

  // Generate pagination items with ellipsis windowing
  const getPageNumbers = () => {
    const delta = 1; // Number of pages before and after current
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (typeof i === 'number') {
        if (l !== undefined) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(i);
        l = i;
      }
    }

    return rangeWithDots;
  };

  const pages = getPageNumbers();
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="my-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-sm select-none"
    >
      {/* Previous Page Button */}
      {hasPrev ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          data-control="prev"
          className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 font-medium text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800 hover:text-white transition-colors"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : (
        <span
          data-control="prev"
          className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-neutral-900 bg-neutral-950/60 px-3 py-2 font-medium text-neutral-600"
          aria-disabled="true"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </span>
      )}

      {/* Numbered Page Buttons */}
      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-2 text-neutral-600 font-bold"
                aria-hidden="true"
              >
                &hellip;
              </span>
            );
          }

          const pageNum = p as number;
          const isCurrent = pageNum === currentPage;

          return isCurrent ? (
            <span
              key={pageNum}
              data-page={pageNum}
              aria-current="page"
              className="flex h-9 min-w-[36px] items-center justify-center rounded-lg bg-red-600 px-3 font-bold text-white shadow-sm"
            >
              {pageNum}
            </span>
          ) : (
            <Link
              key={pageNum}
              href={getPageUrl(pageNum)}
              data-page={pageNum}
              className="flex h-9 min-w-[36px] items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 px-3 font-medium text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800 hover:text-white transition-colors"
              aria-label={`Go to page ${pageNum}`}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Next Page Button */}
      {hasNext ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          data-control="next"
          className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 font-medium text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800 hover:text-white transition-colors"
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span
          data-control="next"
          className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-neutral-900 bg-neutral-950/60 px-3 py-2 font-medium text-neutral-600"
          aria-disabled="true"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
