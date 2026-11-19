/**
 * E2E Test Fixtures
 *
 * Provides 18+ realistic mock post items matching the Sanity Post schema,
 * plus comprehensive mock payloads for feedback API and cache revalidation endpoints.
 */

import { Post } from '@/types/post';

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    slug: 'nextjs-framework',
    title: 'Next.js Framework',
    tag: 'Developer Tools',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/nextjs-preview.png',
    previewImageAlt: 'Next.js App Router and Server Components architecture',
    externalUrl: 'https://nextjs.org',
    destinationDomain: 'nextjs.org',
    publishedAt: '2026-01-10T12:00:00.000Z',
    status: 'active',
    sortOrder: 1,
    description: 'The React framework for high-performance web applications with App Router.',
  },
  {
    id: 'post-2',
    slug: 'tailwind-css',
    title: 'Tailwind CSS',
    tag: 'Design Systems',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/tailwind-preview.png',
    previewImageAlt: 'Tailwind CSS utility classes illustration',
    externalUrl: 'https://tailwindcss.com',
    destinationDomain: 'tailwindcss.com',
    publishedAt: '2026-01-11T12:00:00.000Z',
    status: 'active',
    sortOrder: 2,
    description: 'A utility-first CSS framework packed with classes for rapid UI building.',
  },
  {
    id: 'post-3',
    slug: 'typescript-lang',
    title: 'TypeScript Language',
    tag: 'Developer Tools',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/typescript-preview.png',
    previewImageAlt: 'TypeScript type checking syntax',
    externalUrl: 'https://www.typescriptlang.org',
    destinationDomain: 'typescriptlang.org',
    publishedAt: '2026-01-12T12:00:00.000Z',
    status: 'active',
    sortOrder: 3,
    description: 'Typed JavaScript at Any Scale — extends JavaScript by adding types.',
  },
  {
    id: 'post-4',
    slug: 'sanity-cms',
    title: 'Sanity Studio & CMS',
    tag: 'Infrastructure',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/sanity-preview.png',
    previewImageAlt: 'Sanity Studio structured content workspace',
    externalUrl: 'https://www.sanity.io',
    destinationDomain: 'sanity.io',
    publishedAt: '2026-01-13T12:00:00.000Z',
    status: 'active',
    sortOrder: 4,
    description: 'The Composable Content Cloud for real-time collaboration and structured data.',
  },
  {
    id: 'post-5',
    slug: 'vercel-platform',
    title: 'Vercel Cloud Platform',
    tag: 'Infrastructure',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/vercel-preview.png',
    previewImageAlt: 'Vercel edge deployment and preview dashboard',
    externalUrl: 'https://vercel.com',
    destinationDomain: 'vercel.com',
    publishedAt: '2026-01-14T12:00:00.000Z',
    status: 'active',
    sortOrder: 5,
    description: 'Build and deploy frontend applications with serverless fluid compute and global edge CDN.',
  },
  {
    id: 'post-6',
    slug: 'radix-ui-primitives',
    title: 'Radix UI Primitives',
    tag: 'Design Systems',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/radix-preview.png',
    previewImageAlt: 'Radix unstyled accessible components',
    externalUrl: 'https://www.radix-ui.com',
    destinationDomain: 'radix-ui.com',
    publishedAt: '2026-01-15T12:00:00.000Z',
    status: 'active',
    sortOrder: 6,
    description: 'An open-source UI component library for building accessible design systems.',
  },
  {
    id: 'post-7',
    slug: 'resend-email',
    title: 'Resend Email API',
    tag: 'Developer Tools',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/resend-preview.png',
    previewImageAlt: 'Resend transactional email delivery pipeline',
    externalUrl: 'https://resend.com',
    destinationDomain: 'resend.com',
    publishedAt: '2026-01-16T12:00:00.000Z',
    status: 'active',
    sortOrder: 7,
    description: 'Email for developers — transactional emails with modern REST APIs.',
  },
  {
    id: 'post-8',
    slug: 'lucide-icons',
    title: 'Lucide Icons',
    tag: 'Design Systems',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/lucide-preview.png',
    previewImageAlt: 'Lucide vector icon set',
    externalUrl: 'https://lucide.dev',
    destinationDomain: 'lucide.dev',
    publishedAt: '2026-01-17T12:00:00.000Z',
    status: 'active',
    sortOrder: 8,
    description: 'Beautiful & consistent icon toolkit made by the open-source community.',
  },
  {
    id: 'post-9',
    slug: 'linear-issue-tracker',
    title: 'Linear Issue Tracker',
    tag: 'Productivity',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/linear-preview.png',
    previewImageAlt: 'Linear sprint and issue tracking UI',
    externalUrl: 'https://linear.app',
    destinationDomain: 'linear.app',
    publishedAt: '2026-01-18T12:00:00.000Z',
    status: 'active',
    sortOrder: 9,
    description: 'A purpose-built tool for planning and building software products with speed.',
  },
  {
    id: 'post-10',
    slug: 'obsidian-knowledge-base',
    title: 'Obsidian Knowledge Base',
    tag: 'Productivity',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/obsidian-preview.png',
    previewImageAlt: 'Obsidian markdown graph view',
    externalUrl: 'https://obsidian.md',
    destinationDomain: 'obsidian.md',
    publishedAt: '2026-01-19T12:00:00.000Z',
    status: 'active',
    sortOrder: 10,
    description: 'A sharp, extensible knowledge base that works on your local plain text files.',
  },
  {
    id: 'post-11',
    slug: 'supabase-database',
    title: 'Supabase Postgres Platform',
    tag: 'Databases',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/supabase-preview.png',
    previewImageAlt: 'Supabase database tables and auth',
    externalUrl: 'https://supabase.com',
    destinationDomain: 'supabase.com',
    publishedAt: '2026-01-20T12:00:00.000Z',
    status: 'active',
    sortOrder: 11,
    description: 'The open-source Firebase alternative with full Postgres, Auth, and Realtime.',
  },
  {
    id: 'post-12',
    slug: 'neon-serverless-postgres',
    title: 'Neon Serverless Postgres',
    tag: 'Databases',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/neon-preview.png',
    previewImageAlt: 'Neon database branching workflow',
    externalUrl: 'https://neon.tech',
    destinationDomain: 'neon.tech',
    publishedAt: '2026-01-21T12:00:00.000Z',
    status: 'active',
    sortOrder: 12,
    description: 'Serverless Postgres with branching, scale to zero, and instant point-in-time restore.',
  },
  {
    id: 'post-13',
    slug: 'cloudflare-workers',
    title: 'Cloudflare Workers & CDN',
    tag: 'Infrastructure',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/cloudflare-preview.png',
    previewImageAlt: 'Cloudflare global network map',
    externalUrl: 'https://workers.cloudflare.com',
    destinationDomain: 'cloudflare.com',
    publishedAt: '2026-01-22T12:00:00.000Z',
    status: 'active',
    sortOrder: 13,
    description: 'Deploy serverless code instantly across the globe with high reliability.',
  },
  {
    id: 'post-14',
    slug: 'raycast-launcher',
    title: 'Raycast Productivity Launcher',
    tag: 'Productivity',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/raycast-preview.png',
    previewImageAlt: 'Raycast command palette',
    externalUrl: 'https://www.raycast.com',
    destinationDomain: 'raycast.com',
    publishedAt: '2026-01-23T12:00:00.000Z',
    status: 'active',
    sortOrder: 14,
    description: 'Blazingly fast, extendable launcher for controlling your tools in few keystrokes.',
  },
  {
    id: 'post-15',
    slug: 'huggingface-hub',
    title: 'Hugging Face AI Hub',
    tag: 'AI & ML',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/huggingface-preview.png',
    previewImageAlt: 'Hugging Face models and datasets directory',
    externalUrl: 'https://huggingface.co',
    destinationDomain: 'huggingface.co',
    publishedAt: '2026-01-24T12:00:00.000Z',
    status: 'active',
    sortOrder: 15,
    description: 'The platform where the machine learning community collaborates on models.',
  },
  {
    id: 'post-16',
    slug: 'ollama-local-models',
    title: 'Ollama Local LLM Runner',
    tag: 'AI & ML',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/ollama-preview.png',
    previewImageAlt: 'Ollama command line running Llama 3',
    externalUrl: 'https://ollama.com',
    destinationDomain: 'ollama.com',
    publishedAt: '2026-01-25T12:00:00.000Z',
    status: 'active',
    sortOrder: 16,
    description: 'Get up and running with large language models locally on macOS, Linux, and Windows.',
  },
  {
    id: 'post-17',
    slug: 'archived-sample-post',
    title: 'Legacy Archived Post',
    tag: 'Developer Tools',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/legacy-preview.png',
    previewImageAlt: 'Legacy tool archive image',
    externalUrl: 'https://archive.org',
    destinationDomain: 'archive.org',
    publishedAt: '2025-01-01T00:00:00.000Z',
    status: 'archived',
    sortOrder: 17,
    description: 'This is an archived post that should be excluded from active public listings.',
  },
  {
    id: 'post-18',
    slug: 'special-chars-title-c++-&-c#-guide',
    title: 'Modern C++ & C# Guide: 100% Comprehensive',
    tag: 'Developer Tools',
    previewImage: 'https://cdn.sanity.io/images/project/dataset/special-preview.png',
    previewImageAlt: 'Programming guide preview banner',
    externalUrl: 'https://learn.microsoft.com',
    destinationDomain: 'learn.microsoft.com',
    publishedAt: '2026-01-26T12:00:00.000Z',
    status: 'active',
    sortOrder: 18,
    description: 'Testing special characters: & < > " \' in title and slug.',
  },
];

// Helper to filter active posts in deterministic order
export function getActiveMockPosts(): Post[] {
  return MOCK_POSTS.filter((p) => p.status === 'active').sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    if (a.publishedAt !== b.publishedAt) return b.publishedAt.localeCompare(a.publishedAt);
    return a.id.localeCompare(b.id);
  });
}

// ============================================================================
// Feedback API Mock Payloads
// ============================================================================

export interface FeedbackMockPayload {
  message?: any;
  email?: any;
  name?: any;
  pageUrl?: any;
  hp_val?: any;
}

export const FEEDBACK_FIXTURES = {
  validStandard: {
    message: 'Great directory! Really appreciate the minimalist design and fast loading speeds.',
    email: 'visitor@example.com',
    name: 'Alice Cooper',
    pageUrl: 'http://localhost:3000/post/nextjs-framework',
  },

  validMinimal: {
    message: 'Found a broken external link on the third page.',
    pageUrl: 'http://localhost:3000/',
  },

  invalidEmptyMessage: {
    message: '',
    email: 'visitor@example.com',
    pageUrl: 'http://localhost:3000/',
  },

  invalidWhitespaceMessage: {
    message: '      \n\t   ',
    email: 'visitor@example.com',
    pageUrl: 'http://localhost:3000/',
  },

  invalidTooLongMessage: {
    message: 'A'.repeat(2001), // Exceeds 2000 character maximum
    email: 'visitor@example.com',
    pageUrl: 'http://localhost:3000/',
  },

  invalidMalformedEmail: {
    message: 'Clean layout, but your email validation should catch this.',
    email: 'not-a-valid-email-format@@com',
    pageUrl: 'http://localhost:3000/',
  },

  invalidCrlfInjection: {
    message: 'Attempting CRLF header injection',
    email: 'alice@example.com\r\nBcc: victim@example.org\r\nSubject: Injected Subject',
    pageUrl: 'http://localhost:3000/',
  },

  invalidHoneypotBot: {
    message: 'Buy cheap links now! Click here.',
    email: 'spammer@botnet.ru',
    pageUrl: 'http://localhost:3000/',
    hp_val: 'iamabot', // Honeypot must be empty
  },

  invalidMissingPageUrl: {
    message: 'Missing the pageUrl context attribute.',
    email: 'visitor@example.com',
  },

  invalidScriptXss: {
    message: '<script>alert("xss")</script><img src="x" onerror="alert(1)">',
    name: '"><svg onload=alert(1)>',
    email: 'attacker@example.com',
    pageUrl: 'http://localhost:3000/',
  },

  invalidSqlInjection: {
    message: "'; DROP TABLE feedback; SELECT * FROM users WHERE '1'='1",
    email: "admin'--@example.com",
    pageUrl: 'http://localhost:3000/',
  },
};

export function getFeedbackFixtures() {
  return FEEDBACK_FIXTURES;
}

// ============================================================================
// Cache Revalidation Mock Payloads
// ============================================================================

export const REVALIDATE_FIXTURES = {
  validPostPayload: {
    _type: 'post',
    slug: {
      current: 'nextjs-framework',
    },
  },

  validGlobalPostPayload: {
    _type: 'post',
  },

  invalidNonPostType: {
    _type: 'author',
    slug: {
      current: 'alice-author',
    },
  },

  invalidEmptyPayload: {},

  mockWebhookSecret: 'test-secret-sanity-revalidation-token-abc123xyz',
};

export function getRevalidateFixtures() {
  return REVALIDATE_FIXTURES;
}

export function getMockPosts(): Post[] {
  return [...MOCK_POSTS];
}
