'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, ExternalLink, Lock, CheckCircle2, AlertCircle, RefreshCw, Eye, Upload, Image as ImageIcon, Video, X, Layers, Pencil } from 'lucide-react';
import { compressImageToWebP } from '@/lib/imageOptimizer';

interface SanityPostItem {
  _id: string;
  title: string;
  slug?: { current?: string } | string;
  previewImage?: string;
  gallery?: string[];
  externalUrl: string;
  sortOrder?: number;
  publishedAt?: string;
  description?: string;
  imageCount?: string | number;
  videoCount?: string | number;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState<string>('');

  // Form states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostSlug, setEditingPostSlug] = useState<string>('');
  const [title, setTitle] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState('1');
  const [imageCount, setImageCount] = useState('');
  const [videoCount, setVideoCount] = useState('');
  const [description, setDescription] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [posts, setPosts] = useState<SanityPostItem[]>([]);
  const [fetchingPosts, setFetchingPosts] = useState(false);

  useEffect(() => {
    // Purge any stored admin keys to guarantee admin NEVER opens automatically without password
    try {
      localStorage.removeItem('xoohub_admin_key');
      sessionStorage.removeItem('xoohub_admin_key');
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setAdminKey('');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = keyInput.trim();
    if (!candidate) return;

    setLoginLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/post', {
        headers: { Authorization: `Bearer ${candidate}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAdminKey(candidate);
        setIsAuthenticated(true);
        setPosts(data);
        setMessage(null);
      } else if (res.status === 401) {
        setIsAuthenticated(false);
        setMessage({ type: 'error', text: 'Invalid passcode. Please enter the correct admin key.' });
      } else if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setIsAuthenticated(false);
        setMessage({ type: 'error', text: data.error || 'Too many attempts. Access temporarily locked.' });
      } else {
        const data = await res.json().catch(() => ({}));
        setIsAuthenticated(false);
        setMessage({ type: 'error', text: data.error || 'Authentication failed. Please check your passcode.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Could not connect to CMS server.' });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('xoohub_admin_key');
      sessionStorage.removeItem('xoohub_admin_key');
    } catch {
      // ignore
    }
    setAdminKey('');
    setKeyInput('');
    setIsAuthenticated(false);
    setPosts([]);
    setMessage(null);
  };

  const fetchPosts = async (key: string) => {
    if (!key) return;
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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImage(true);
    setMessage(null);

    try {
      const newUrls: string[] = [];
      let totalOriginalBytes = 0;
      let totalCompressedBytes = 0;

      for (const file of files) {
        // Automatically optimize & convert to WebP in browser before uploading
        const { file: optimizedFile, originalSize, compressedSize } = await compressImageToWebP(file);
        totalOriginalBytes += originalSize;
        totalCompressedBytes += compressedSize;

        const formData = new FormData();
        formData.append('file', optimizedFile);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminKey}`,
          },
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          newUrls.push(data.url);
        } else {
          setMessage({ type: 'error', text: data.error || `Failed to upload ${file.name}` });
        }
      }

      if (newUrls.length > 0) {
        // Set first as preview image if currently empty
        if (!previewImage) {
          setPreviewImage(newUrls[0]);
        }
        setGallery((prev) => [...prev, ...newUrls]);

        const savedPercent =
          totalOriginalBytes > 0
            ? Math.round(((totalOriginalBytes - totalCompressedBytes) / totalOriginalBytes) * 100)
            : 0;

        setMessage({
          type: 'success',
          text: `Uploaded ${newUrls.length} image(s) to Sanity CDN! Converted to WebP (Saved ~${savedPercent}% storage: ${(totalOriginalBytes / 1024).toFixed(0)}KB → ${(totalCompressedBytes / 1024).toFixed(0)}KB).`,
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error during image upload' });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveFromGallery = (indexToRemove: number) => {
    setGallery((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length > 0) {
        setPreviewImage(updated[0]);
      } else {
        setPreviewImage('');
      }
      return updated;
    });
  };

  const handleSetCover = (url: string) => {
    setPreviewImage(url);
    setGallery((prev) => [url, ...prev.filter((u) => u !== url)]);
  };

  const handleStartEdit = (post: SanityPostItem) => {
    setEditingPostId(post._id);
    const slugStr =
      typeof post.slug === 'object' && post.slug?.current
        ? post.slug.current
        : typeof post.slug === 'string'
        ? post.slug
        : '';
    setEditingPostSlug(slugStr);
    setTitle(post.title || '');
    setExternalUrl(post.externalUrl || '');
    setPreviewImage(post.previewImage || '');

    let postGallery: string[] = [];
    if (Array.isArray(post.gallery) && post.gallery.length > 0) {
      postGallery = post.gallery;
    } else if (post.previewImage) {
      postGallery = [post.previewImage];
    }
    setGallery(postGallery);
    setSortOrder(String(post.sortOrder || 1));
    setImageCount(post.imageCount !== undefined && post.imageCount !== null ? String(post.imageCount) : '');
    setVideoCount(post.videoCount !== undefined && post.videoCount !== null ? String(post.videoCount) : '');
    setDescription(post.description || '');
    setMessage({
      type: 'success',
      text: `Editing "${post.title}". Update the fields below and click "Save & Update Post".`,
    });

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditingPostSlug('');
    setTitle('');
    setExternalUrl('');
    setPreviewImage('');
    setGallery([]);
    setImageCount('');
    setVideoCount('');
    setDescription('');
    setSortOrder(String(posts.length + 1));
    setMessage(null);
  };

  const handleCreateOrUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const cover = previewImage || (gallery.length > 0 ? gallery[0] : '');
      const finalGallery =
        gallery.length > 0
          ? gallery.includes(cover)
            ? gallery
            : [cover, ...gallery]
          : cover
          ? [cover]
          : [];

      if (editingPostId) {
        // UPDATE Existing Post via PUT
        const res = await fetch('/api/admin/post', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminKey}`,
          },
          body: JSON.stringify({
            id: editingPostId,
            slug: editingPostSlug,
            title,
            externalUrl,
            previewImage: cover,
            gallery: finalGallery,
            sortOrder: Number(sortOrder) || 1,
            imageCount: imageCount.trim() || undefined,
            videoCount: videoCount.trim() || undefined,
            description,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          setMessage({ type: 'success', text: `Post "${title}" updated live successfully!` });
          handleCancelEdit();
          fetchPosts(adminKey);
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to update post' });
        }
      } else {
        // CREATE New Post via POST
        const res = await fetch('/api/admin/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminKey}`,
          },
          body: JSON.stringify({
            title,
            externalUrl,
            previewImage: cover,
            gallery: finalGallery,
            sortOrder: Number(sortOrder) || 1,
            imageCount: imageCount.trim() || undefined,
            videoCount: videoCount.trim() || undefined,
            description,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          setMessage({ type: 'success', text: `Post "${title}" published live successfully!` });
          setTitle('');
          setExternalUrl('');
          setPreviewImage('');
          setGallery([]);
          setImageCount('');
          setVideoCount('');
          setDescription('');
          setSortOrder(String(posts.length + 2));
          fetchPosts(adminKey);
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to create post' });
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error occurred while saving post' });
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
              disabled={loginLoading}
              className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Verifying Passcode...</span>
                </>
              ) : (
                'Sign In to CMS'
              )}
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {editingPostId ? (
                  <>
                    <Pencil className="h-4 w-4 text-amber-400" />
                    <h2 className="text-base font-bold text-white">Edit Post</h2>
                    <span className="rounded bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      Edit Mode
                    </span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 text-red-500" />
                    <h2 className="text-base font-bold text-white">Add New Post</h2>
                  </>
                )}
              </div>

              {editingPostId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-md border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleCreateOrUpdatePost} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-neutral-300">
                    Post Images / Gallery <span className="text-red-500">*</span>
                  </label>
                  {gallery.length > 1 && (
                    <span className="flex items-center gap-1 rounded bg-red-950/80 border border-red-800/50 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                      <Layers className="h-3 w-3 text-red-400" />
                      Slideshow ({gallery.length} Photos)
                    </span>
                  )}
                </div>
                
                {/* Upload to Sanity or URL options */}
                <div className="mt-1.5 space-y-2">
                  <div>
                    <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-red-900/60 bg-red-950/20 px-4 py-3 text-xs font-medium text-red-200 hover:border-red-600 hover:bg-red-950/40 hover:text-white cursor-pointer transition">
                      {uploadingImage ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-red-500" />
                          <span>Converting to WebP & Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-red-400 shrink-0" />
                          <div className="text-left">
                            <span className="font-semibold text-white block">Upload Image(s) — Auto-WebP</span>
                            <span className="text-[10px] text-neutral-400 block">Select 1 or multiple photos. Converts to WebP (saves ~90% storage).</span>
                          </div>
                        </>
                      )}
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Multi-Photo Gallery Thumbnail Strip */}
                  {gallery.length > 0 && (
                    <div className="space-y-1.5 rounded-lg border border-neutral-800 bg-neutral-950/80 p-2.5">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span>Selected Slides ({gallery.length}):</span>
                        <span className="text-[10px] text-neutral-500">First image is cover card</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                        {gallery.map((url, idx) => {
                          const isCover = (previewImage && previewImage === url) || (!previewImage && idx === 0);
                          return (
                            <div
                              key={url + idx}
                              className={`group relative h-16 w-16 shrink-0 overflow-hidden rounded-md border transition ${
                                isCover ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-800 hover:border-neutral-700'
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Slide ${idx + 1}`} className="h-full w-full object-cover" />
                              <span className="absolute bottom-0.5 left-0.5 rounded bg-black/80 px-1 text-[8px] font-mono text-white">
                                {isCover ? 'Cover' : `#${idx + 1}`}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromGallery(idx)}
                                className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition shadow"
                                title="Remove photo"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="url"
                      value={previewImage}
                      onChange={(e) => {
                        setPreviewImage(e.target.value);
                        if (e.target.value && !gallery.includes(e.target.value)) {
                          setGallery((prev) => [e.target.value, ...prev]);
                        }
                      }}
                      placeholder="Or paste direct image URL (ImgBB, Imgur, Sanity CDN)..."
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Thumbnail Live Preview with Ambient Blurred Backdrop */}
                  {previewImage && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span>Cover Card Preview:</span>
                        <span className="text-[10px] text-emerald-400 font-medium">Uncropped with Ambient Backdrop</span>
                      </div>
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
                        {/* Layer 1: Ambient Blurred Backdrop */}
                        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewImage}
                            alt=""
                            className="h-full w-full object-cover scale-125 filter blur-xl opacity-60 brightness-75 select-none"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
                        </div>

                        {/* Layer 2: Full Centered Image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="relative z-[2] h-full w-full object-contain pointer-events-none select-none"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-neutral-500">
                    Supports portrait, square, and landscape images without cropping.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                <div>
                  <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3 text-red-400" />
                    <span>Images</span>
                  </label>
                  <input
                    type="text"
                    value={imageCount}
                    onChange={(e) => setImageCount(e.target.value)}
                    placeholder="e.g. 24"
                    className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-red-500 focus:outline-none"
                  />
                  <p className="mt-0.5 text-[10px] text-neutral-500">Optional icon</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1">
                    <Video className="h-3 w-3 text-red-400" />
                    <span>Videos</span>
                  </label>
                  <input
                    type="text"
                    value={videoCount}
                    onChange={(e) => setVideoCount(e.target.value)}
                    placeholder="e.g. 2"
                    className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-red-500 focus:outline-none"
                  />
                  <p className="mt-0.5 text-[10px] text-neutral-500">Optional icon</p>
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
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50 ${
                  editingPostId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{editingPostId ? 'Saving Updates...' : 'Publishing...'}</span>
                  </>
                ) : editingPostId ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save & Update Post</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Publish Post Live</span>
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

                const isEditingThis = editingPostId === post._id;

                return (
                  <div
                    key={post._id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                      isEditingThis
                        ? 'border-amber-500/80 bg-amber-950/20 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
                        : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Thumbnail */}
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-950 border border-neutral-800">
                        {/* Layer 1: Ambient Blurred Backdrop */}
                        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt=""
                            className="h-full w-full object-cover scale-125 filter blur-sm opacity-50 brightness-75 select-none"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        {/* Layer 2: Full Centered Image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt={post.title}
                          className="relative z-[2] h-full w-full object-contain pointer-events-none select-none"
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
                          {isEditingThis && (
                            <span className="rounded bg-amber-950 border border-amber-800/60 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                              Editing
                            </span>
                          )}
                          {post.gallery && post.gallery.length > 1 && (
                            <span className="flex items-center gap-0.5 rounded bg-red-950/80 border border-red-800/40 px-1.5 py-0.5 text-[9px] font-medium text-red-400 shrink-0">
                              <Layers className="h-2.5 w-2.5" />
                              {post.gallery.length} photos
                            </span>
                          )}
                          {post.imageCount && (
                            <span className="flex items-center gap-1 rounded bg-neutral-800/80 px-1.5 py-0.5 text-[9px] text-neutral-300 shrink-0 border border-neutral-700/40">
                              <ImageIcon className="h-2.5 w-2.5 text-red-400" />
                              {post.imageCount}
                            </span>
                          )}
                          {post.videoCount && (
                            <span className="flex items-center gap-1 rounded bg-neutral-800/80 px-1.5 py-0.5 text-[9px] text-neutral-300 shrink-0 border border-neutral-700/40">
                              <Video className="h-2.5 w-2.5 text-red-400" />
                              {post.videoCount}
                            </span>
                          )}
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
                        onClick={() => handleStartEdit(post)}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                          isEditingThis
                            ? 'border-amber-600 bg-amber-950/50 text-amber-300'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                        }`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {isEditingThis ? 'Editing' : 'Edit'}
                      </button>

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
