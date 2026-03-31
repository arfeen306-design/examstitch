import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Layers } from 'lucide-react';
import { getCategoryBySlug, getTopicsByCategory } from '@/lib/supabase/queries';
import { isSupabaseConfigured } from '@/lib/supabase/is-configured';
import { aLevelPapers } from '@/config/navigation';

const DEMO_TOPICS = [
  { topic: 'Quadratics', count: 12 },
  { topic: 'Functions', count: 18 },
  { topic: 'Coordinate Geometry', count: 15 },
  { topic: 'Circular Measure', count: 10 },
  { topic: 'Trigonometry', count: 8 },
  { topic: 'Series', count: 9 },
  { topic: 'Differentiation', count: 11 },
  { topic: 'Integration', count: 7 },
  { topic: 'Kinematics', count: 14 },
];

function TopicList({
  topics,
  basePath,
}: {
  topics: { topic: string; count: number }[];
  basePath: string;
}) {
  if (!topics.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl mt-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px dashed var(--border-color)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--accent-subtle)' }}>
          <Layers className="w-8 h-8" style={{ color: 'var(--accent-text)' }} />
        </div>
        <h3 className="text-xl font-bold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>Coming Soon</h3>
        <p className="text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>
          These resources are currently being stitched. Our QA engineers are verifying the mark schemes and will push them live shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {topics.map((item) => {
        const slug = item.topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return (
          <Link key={item.topic} href={`${basePath}/${slug}`} className="block group">
            <div className="card-hover rounded-2xl p-5 shadow-sm flex items-center gap-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                <BookOpen className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold transition-colors truncate group-hover:text-[var(--cta-orange)]" style={{ color: 'var(--text-primary)' }}>
                  {item.topic}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.count} worksheet{item.count !== 1 ? 's' : ''}</p>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-all shrink-0" style={{ color: 'var(--text-muted)' }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

async function TopicsGrid({ subject, paper, basePath }: { subject: string; paper: string; basePath: string }) {
  if (!isSupabaseConfigured()) {
    return <TopicList topics={DEMO_TOPICS} basePath={basePath} />;
  }

  try {
    const category = await getCategoryBySlug(subject, paper);
    if (!category) return <TopicList topics={[]} basePath={basePath} />;
    const topics = await getTopicsByCategory(category.id);
    return <TopicList topics={topics} basePath={basePath} />;
  } catch (err) {
    console.error('TopicsGrid error:', err);
    return <TopicList topics={DEMO_TOPICS} basePath={basePath} />;
  }
}

function TopicsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 animate-pulse flex items-center gap-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="w-11 h-11 rounded-xl shrink-0" style={{ backgroundColor: 'var(--border-subtle)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-4 rounded-full w-3/4" style={{ backgroundColor: 'var(--border-subtle)' }} />
            <div className="h-3 rounded-full w-1/3" style={{ backgroundColor: 'var(--bg-surface)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TopicalPage({ params }: { params: { subject: string; paper: string } }) {
  const allPapers = [...aLevelPapers['as-level'], ...aLevelPapers['a2-level']];
  const paperConfig = allPapers.find(p => p.slug === params.paper);
  const paperName = paperConfig?.label || params.paper.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const levelSlug = aLevelPapers['as-level'].find(p => p.slug === params.paper) ? 'as-level' : 'a2-level';
  const levelName = levelSlug === 'as-level' ? 'AS Level' : 'A2 Level';
  
  const basePath = `/alevel/${params.subject}/${levelSlug}/${params.paper}/topical`;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="gradient-hero py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
            <Link href="/alevel" className="text-white/50 hover:text-white/70 transition-colors">A-Level</Link>
            <span className="text-white/30">/</span>
            <Link href={`/alevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">Mathematics (9709)</Link>
            <span className="text-white/30">/</span>
            <Link href={`/alevel/${params.subject}/${levelSlug}`} className="text-white/50 hover:text-white/70 transition-colors">{levelName}</Link>
            <span className="text-white/30">/</span>
            <Link href={`/alevel/${params.subject}/${levelSlug}/${params.paper}`} className="text-white/50 hover:text-white/70 transition-colors">{paperName}</Link>
            <span className="text-white/30">/</span>
            <span style={{ color: "var(--accent)" }} className="font-medium">Topical Worksheets</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{paperName} — Topical Worksheets</h1>
          <p className="text-white/60">Master individual topics with focused practice questions.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <Suspense fallback={<TopicsSkeleton />}>
          <TopicsGrid subject={params.subject} paper={params.paper} basePath={basePath} />
        </Suspense>
      </div>
    </div>
  );
}
