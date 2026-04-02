import Link from 'next/link';
import { BookOpen, Clock, ArrowRight, Megaphone, Download, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import MediaSection from '@/components/media/MediaSection';

export const metadata: Metadata = {
  title: 'Blog — ExamStitch',
  description: 'Announcements, study tips, exam strategies, and Cambridge Mathematics insights from the ExamStitch team.',
};

const PLACEHOLDER_POSTS = [
  {
    title: 'How to Score A* in Cambridge A-Level Mathematics',
    excerpt: 'A comprehensive guide covering study techniques, time management, and the most commonly tested topics in Paper 1 and Paper 3.',
    category: 'Study Tips',
    readTime: '8 min read',
  },
  {
    title: '5 Common Mistakes Students Make in Probability & Statistics',
    excerpt: 'From misreading conditional probability questions to forgetting the continuity correction — learn how to avoid these pitfalls.',
    category: 'Paper 5',
    readTime: '6 min read',
  },
  {
    title: 'The Ultimate O-Level Math Revision Checklist',
    excerpt: 'A topic-by-topic checklist for Cambridge O-Level Mathematics (4024) to ensure you don\'t miss anything before exam day.',
    category: 'Revision',
    readTime: '5 min read',
  },
];

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

interface Blog {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
}

async function getBlogs(): Promise<Blog[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('blogs')
      .select('id, title, content, image_url, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    return (data ?? []) as Blog[];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const blogs = await getBlogs();

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero */}
      <div className="gradient-hero py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4">
            <BookOpen className="w-4 h-4 text-gold-400" />
            <span className="text-xs font-medium text-gold-400 uppercase tracking-wider">ExamStitch Blog</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Insights &amp; Updates
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Announcements, exam timetables, study tips, and Cambridge Mathematics insights — all in one place.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-10">

        {/* ── Live announcements from admin ── */}
        {blogs.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Announcements
              </h2>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
            </div>
            <div className="space-y-5">
              {blogs.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'rgba(168,85,247,0.12)', color: '#A855F7' }}
                    >
                      <Megaphone className="w-3 h-3" />
                      Announcement
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {timeAgo(post.created_at)}
                    </span>
                  </div>

                  <h2
                    className="text-lg font-bold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {post.title}
                  </h2>

                  {post.content && (
                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {post.content}
                    </p>
                  )}

                  {post.image_url && (
                    <div className="mt-4">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full rounded-xl object-contain max-h-[600px] border"
                        style={{ borderColor: 'var(--border-subtle)' }}
                        loading="lazy"
                      />
                      <a
                        href={post.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                        style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Image
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Upcoming articles (only show if no real posts yet) ── */}
        {blogs.length === 0 && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Coming Soon
              </h2>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
            </div>
            <div className="space-y-5">
              {PLACEHOLDER_POSTS.map((post, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 shadow-sm relative overflow-hidden opacity-70"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div className="absolute top-4 right-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}>
                      Coming Soon
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Clock className="w-3 h-3" /> {post.readTime}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {post.title}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {post.excerpt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 text-center rounded-2xl p-8 shadow-lg"
             style={{ background: 'linear-gradient(135deg, var(--hero-from), var(--hero-to))' }}>
          <h3 className="text-xl font-bold text-white mb-2">Want to be notified when we publish?</h3>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Join our mailing list — we'll send you study guides and exam tips directly.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-dark)' }}
          >
            Subscribe <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Media widgets */}
        <div className="mt-10">
          <MediaSection pageSlug="blog" heading="Featured Media" columns={2} />
        </div>
      </div>
    </div>
  );
}
