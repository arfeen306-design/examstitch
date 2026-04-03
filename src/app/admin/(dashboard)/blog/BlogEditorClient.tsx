'use client';

/**
 * BlogEditorClient — Admin modal for creating blog posts.
 * Uses public image URLs (Option B — consistent with Drive/YT pattern).
 */

import { useState, useTransition } from 'react';
import { X, Image, FileText, Send, Trash2, ExternalLink } from 'lucide-react';
import { createBlogPost, deleteBlogPost } from '@/app/admin/actions';

interface Blog {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  is_published: boolean;
}

interface Props {
  initialPosts: Blog[];
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function BlogEditorClient({ initialPosts }: Props) {
  const [posts, setPosts] = useState<Blog[]>(initialPosts);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  function resetForm() {
    setTitle(''); setContent(''); setImageUrl(''); setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('content', content.trim());
    fd.append('image_url', imageUrl.trim());

    startTransition(async () => {
      const result = await createBlogPost(fd);
      if (result.success && result.post) {
        setPosts(prev => [result.post as Blog, ...prev]);
        resetForm();
        setShowModal(false);
      } else {
        setError(result.error ?? 'Failed to create post');
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return;
    startTransition(async () => {
      const result = await deleteBlogPost(id);
      if (result.success) {
        setPosts(prev => prev.filter(p => p.id !== id));
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Blog / Updates</h2>
          <p className="text-sm text-white/40 mt-1">{posts.length} posts · shown on homepage feed</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #1A2B56, #0F1A38)' }}
        >
          <Send className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Post List */}
      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="text-center py-16 text-white/40">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No posts yet. Create your first announcement.</p>
          </div>
        )}
        {posts.map(post => (
          <div
            key={post.id}
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex items-start gap-4 shadow-sm"
          >
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/[0.08]"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-white truncate">{post.title}</h3>
                <span className="text-xs text-white/40">{timeAgo(post.created_at)}</span>
              </div>
              {post.content && (
                <p className="text-sm text-white/40 line-clamp-2">{post.content}</p>
              )}
              {post.image_url && (
                <a
                  href={post.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-xs text-blue-500 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> View image
                </a>
              )}
            </div>
            <button
              onClick={() => handleDelete(post.id)}
              disabled={isPending}
              className="shrink-0 p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/[0.04] rounded-2xl shadow-2xl w-full max-w-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
              <h3 className="font-bold text-white text-lg">New Announcement</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., A-Level 2026 Timetable Released"
                  className="w-full px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Description
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your announcement here..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5 flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-white/30" />
                  Image URL <span className="text-white/30 font-normal">(optional — timetable, etc.)</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or direct image URL"
                  className="w-full px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                />
                <p className="text-xs text-white/30 mt-1">Paste a Google Drive or direct image link. A download button will appear automatically.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-white/50 hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1A2B56, #0F1A38)' }}
                >
                  <Send className="w-4 h-4" />
                  {isPending ? 'Publishing…' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
