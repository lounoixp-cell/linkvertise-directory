export interface Post {
  id: string;               // Unique identifier (_id or fallback id)
  slug: string;             // URL slug for /post/[slug]
  title: string;            // Display title
  tag: string;              // Category/tag
  previewImage: string;     // Image URL or Sanity Image object
  previewImageAlt?: string; // Accessibility alt text
  externalUrl: string;      // Outbound destination URL
  destinationDomain: string;// Clean domain for display (e.g. "linkvertise.com")
  publishedAt: string;      // ISO datetime string
  status: 'active' | 'archived';
  sortOrder: number;        // Deterministic sorting integer
  description?: string;     // Optional summary
  category?: string;        // Backward compatibility with initial mock
  tags?: string[];          // Backward compatibility with initial mock
}

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
