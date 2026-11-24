'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, ExternalLink, Lock, CheckCircle2, AlertCircle, RefreshCw, Eye, Upload, Image as ImageIcon } from 'lucide-react';

interface SanityPostItem {
  _id: string;
  title: string;
  slug?: { current?: string } | string;
  previewImage?: string;
  externalUrl: string;
  sortOrder?: number;
  publishedAt?: string;
  description?: string;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState<string>('');

  // Form states
  const [title, setTitle] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [description, setDescription] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [posts, setPosts] = useState<SanityPostItem[]>([]);
  const [fetchingPosts, setFetchingPosts] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('xoohub_admin_key');
    if (saved) {
      setAdminKey(saved);
      setIsAuthenticated(true);
      fetchPosts(saved);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      localStorage.setItem('xoohub_admin_key', keyInput.trim());
      setAdminKey(keyInput.trim());
      setIsAuthenticated(true);
      fetchPosts(keyInput.trim());
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('xoohub_admin_key');
    setAdminKey('');
    setIsAuthenticated(false);
    setPosts([]);
  };

  const fetchPosts = async (key: string) => {
    setFetchingPosts(true);
    try {
      const res = await fetch('/api/admin/post', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else if (res.status === 401) {
        handleLogout();
        setMessage({ type: 'error', text: 'Invalid passcode. Please enter the correct admin key.' });
      } else if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        handleLogout();
        setMessage({ type: 'error', text: data.error || 'Too many attempts. Access temporarily locked.' });
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: data.error || 'Failed to authenticate with CMS server.' });
      }
    } catch {
      // ignore
    } finally {
      setFetchingPosts(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminKey}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setPreviewImage(data.url);
        setMessage({ type: 'success', text: 'Image uploaded to Sanity CDN successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to upload image' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error during image upload' });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({
          title,
          externalUrl,
          previewImage,
          sortOrder: Number(sortOrder) || 1,
          description,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Post "${title}" published live successfully!` });
        setTitle('');
        setExternalUrl('');
        setPreviewImage('');
        setDescription('');
        setSortOrder(String(posts.length + 2));
        fetchPosts(adminKey);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create post' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error occurred while creating post' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string, slugStr?: string) => {
    if (!confirm('Are you sure you want to permanently delete this post?')) return;

    try {
      const res = await fetch('/api/admin/post', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({ id, slug: slugStr }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Post deleted successfully!' });
        fetchPosts(adminKey);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete post' });
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/90 p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/10 text-red-500 mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-white">xoohub CMS Access</h1>
            <p className="mt-1 text-sm text-neutral-400">Enter your admin passcode to manage posts</p>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="passcode" className="block text-xs font-medium text-neutral-300">
                Admin Passcode
              </label>
              <input
                id="passcode"
                type="password"
                required
                autoComplete="current-password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="••••••••••••"
                className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500"
            >
              Sign In to CMS
            </button>
          </form>

          {message && (
            <p className="mt-4 text-center text-xs text-red-400">{message.text}</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">xoohub Content Manager</h1>
            <span className="rounded bg-red-950/80 border border-red-800/40 px-2 py-0.5 text-[10px] font-semibold text-red-400">
              CMS
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Publish, edit, and organize link listings connected to your Sanity database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:border-neutral-700 transition"
          >
            <Eye className="h-3.5 w-3.5" />
            View Site
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 flex items-center gap-2.5 rounded-xl border p-4 text-sm ${
            message.type === 'success'
              ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300'
              : 'border-red-900/60 bg-red-950/30 text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form to Add Post */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-4 w-4 text-red-500" />
              <h2 className="text-base font-bold text-white">Add New Post</h2>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300">
                  Post Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cyberpunk Noir Gallery Vol. 1"
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300">
                  Destination URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://linkvertise.com/..."
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300">
                  Preview Image <span className="text-red-500">*</span>
                </label>
                
                {/* Upload or URL options */}
                <div className="mt-1.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-700 bg-neutral-950/60 px-3 py-2 text-xs font-medium text-neutral-300 hover:border-neutral-500 hover:text-white cursor-pointer transition">
                      {uploadingImage ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-red-500" />
                          <span>Uploading to CDN...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-neutral-400" />
                          <span>Upload File from Device</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="url"
                      required
                      value={previewImage}
                      onChange={(e) => setPreviewImage(e.target.value)}
                      placeholder="Or paste direct image URL (ImgBB, Imgur, CDN)..."
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Thumbnail Live Preview */}
                  {previewImage && (
                    <div className="relative mt-2 aspect-[16/10] w-full overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-neutral-500">
                    Auto-resolves ImgBB, Imgur, and direct image links.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-red-500 focus:outline-none"
                  />
                  <p className="mt-0.5 text-[10px] text-neutral-500">1 = First on page</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300">
                  Description <span className="text-neutral-500 text-[11px]">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief note or details about the content..."
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-red-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Publish Post Live
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Posts List */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Live Posts
              <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                {posts.length}
              </span>
            </h2>

            <button
              onClick={() => fetchPosts(adminKey)}
              disabled={fetchingPosts}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${fetchingPosts ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {fetchingPosts && posts.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-neutral-500">
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 p-6 text-center text-xs text-neutral-500">
              No posts found. Use the form on the left to add your first post!
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                const slugVal =
                  typeof post.slug === 'object' && post.slug?.current
                    ? post.slug.current
                    : typeof post.slug === 'string'
                    ? post.slug
                    : post._id;

                const imgUrl =
                  typeof post.previewImage === 'string'
                    ? post.previewImage
                    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

                return (
                  <div
                    key={post._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3.5 transition hover:border-neutral-700"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Thumbnail */}
                      <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-950 border border-neutral-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400">
                            #{post.sortOrder || 1}
                          </span>
                          <h3 className="text-sm font-semibold text-white truncate">
                            {post.title}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-neutral-500 truncate flex items-center gap-1">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          {post.externalUrl}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Link
                        href={`/post/${slugVal}`}
                        target="_blank"
                        className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                      >
                        View
                      </Link>

                      <button
                        onClick={() => handleDeletePost(post._id, slugVal)}
                        className="flex items-center gap-1 rounded-lg border border-red-950/60 bg-red-950/20 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-950 hover:text-red-300 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
