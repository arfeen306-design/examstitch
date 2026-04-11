import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Layers } from 'lucide-react';
import { getCategoryBySlug, getTopicsByCategory } from '@/lib/supabase/queries';
import { isSupabaseConfigured } from '@/lib/supabase/is-configured';
import { aLevelPapers, aLevelPapersBySubject, getSubjectLabel } from '@/config/navigation';

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
      <div className="flex flex-col items-center py-16 text-center portal-topic-empty">
        <Layers className="w-10 h-10 mb-3 text-white/30" />
        <h3 className="text-base font-semibold mb-1 text-white/60">No topical worksheets yet</h3>
        <p className="text-sm max-w-xs text-white/30">
          Upload worksheets with a &ldquo;topic&rdquo; tag via the admin dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {topics.map((item) => {
        const slug = item.topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return (
          <Link key={item.topic} href={`${basePath}/${slug}`} className="block group portal-topic-link">
            <div className="portal-topic-card rounded-2xl p-5 flex items-center gap-4 transition-all duration-300
                            portal-glass-card portal-glass-card--interactive">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                              bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="portal-topic-title text-sm font-semibold text-white/80 transition-colors truncate group-hover:text-white">
                  {item.topic}
                </h3>
                <p className="portal-topic-meta text-xs text-white/30">{item.count} worksheet{item.count !== 1 ? 's' : ''}</p>
              </div>
              <ArrowRight className="portal-topic-arrow w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all shrink-0" />
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
        <div key={i} className="rounded-2xl p-5 animate-pulse flex items-center gap-4 portal-skeleton-panel">
          <div className="w-11 h-11 rounded-xl shrink-0 portal-skeleton-bone" />
          <div className="flex-1 space-y-2">
            <div className="h-4 rounded-full w-3/4 portal-skeleton-bone" />
            <div className="h-3 rounded-full w-1/3 portal-skeleton-bone opacity-70" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TopicalPage({ params }: { params: { subject: string; paper: string } }) {
  const papers = aLevelPapersBySubject[params.subject] ?? aLevelPapers;
  const allPapers = [...papers['as-level'], ...papers['a2-level']];
  const paperConfig = allPapers.find(p => p.slug === params.paper);
  const paperName = paperConfig?.label || params.paper.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const levelSlug = papers['as-level'].find(p => p.slug === params.paper) ? 'as-level' : 'a2-level';
  const levelName = levelSlug === 'as-level' ? 'AS Level' : 'A2 Level';
  
  const basePath = `/alevel/${params.subject}/${levelSlug}/${params.paper}/topical`;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="gradient-hero pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
            <Link href="/alevel" className="text-white/50 hover:text-white/70 transition-colors">A-Level</Link>
            <span className="text-white/30">/</span>
            <Link href={`/alevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">{getSubjectLabel(params.subject)}</Link>
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
      <div className="portal-page-body portal-surface-navy max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <Suspense fallback={<TopicsSkeleton />}>
          <TopicsGrid subject={params.subject} paper={params.paper} basePath={basePath} />
        </Suspense>
      </div>
    </div>
  );
}
