# Linkvertise Directory

A minimalist, content-first link listing website built with **Next.js 14**, **Sanity CMS**, and **Tailwind CSS**, designed for high performance and deployment on **Vercel**.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env.local
```

Configure your Sanity and Resend credentials in `.env.local`:
```env
# Public Sanity configuration (browser & server)
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-03-01

# Secret credentials (server-only — NEVER expose with NEXT_PUBLIC_)
SANITY_API_TOKEN=your_sanity_read_token
SANITY_REVALIDATE_SECRET=your_webhook_revalidation_secret
RESEND_API_KEY=your_resend_api_key
FEEDBACK_RECIPIENT_EMAIL=your_email@example.com
```
*(Note: If no Sanity credentials are provided, the site gracefully uses built-in fallback data).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the site.

### 4. Build & Typecheck
```bash
npm run build
```

### 5. Run Test Suite
```bash
npm run test:e2e
```
Runs 54 test suites (295 tests) covering all features, boundaries, and scenarios in <100ms.

---

## 🏗 Architecture & Features

- **Strict Minimalist UI**: Content-first card grid (1 col mobile, 3–4 cols desktop), zero decorative clutter.
- **Deterministic Ordering**: Posts sorted by `order(sortOrder asc, publishedAt desc, _id asc)` across homepage pagination and `/post/[id]` previous/next navigation.
- **Sanity CMS Integration**: Schema defined in `src/sanity/schemas/post.ts`, GROQ queries with ISR revalidation webhook (`/api/revalidate`).
- **Safe External Links**: External destinations open only from detail pages (`/post/[id]`) with `target="_blank" rel="noopener noreferrer"` and URL validation.
- **Secure Feedback System**: Modal with focus trap, honeypot bot trap, IP-based rate limiting, CRLF sanitization, and Resend email delivery.
- **Vercel Production Ready**: Configured for static site generation (SSG) with ISR, remote image domain whitelisting, and zero client-side secret exposure.
