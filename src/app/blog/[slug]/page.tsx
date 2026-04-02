import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Megaphone } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import MediaSection from '@/components/media/MediaSection';

export const dynamic = 'force-dynamic';

interface BlogPost {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from('blogs')
    .select('title')
    .eq('id', params.slug)
    .single();

  return {
    title: data ? `${data.title} — ExamStitch Blog` : 'Blog Post — ExamStitch',
  };
}

export default async function BlogSlugPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  // Try to find by id (uuid) first, or fall back to title-slug lookup
  const { data: post } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', params.slug)
    .eq('is_published', true)
    .single();

  if (!post) notFound();

  const blog = post as BlogPost;

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors hover:opacity-80"
          style={{ color: 'var(--accent)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Post header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(168,85,247,0.12)', color: '#A855F7' }}
            >
              <Megaphone className="w-3 h-3" />
              Announcement
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock className="w-3 h-3" />
              {timeAgo(blog.created_at)}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {blog.title}
          </h1>
        </div>

        {/* Post content */}
        {blog.image_url && (
          <img
            src={blog.image_url}
            alt={blog.title}
            className="w-full rounded-2xl object-contain max-h-[600px] mb-8 border"
            style={{ borderColor: 'var(--border-subtle)' }}
          />
        )}

        {blog.content && (
          <div
            className="prose prose-lg max-w-none mb-12"
            style={{ color: 'var(--text-secondary)' }}
          >
            {blog.content.split('\n').map((p, i) =>
              p.trim() ? <p key={i}>{p}</p> : null
            )}
          </div>
        )}

        {/* Embedded media widgets for this blog */}
        <MediaSection pageSlug="blog" heading="Related Media" columns={1} />
      </div>
    </div>
  );
}
