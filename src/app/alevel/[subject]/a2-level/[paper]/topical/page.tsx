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
      <div className="flex flex-col items-center py-16 text-center">
        <Layers className="w-10 h-10 text-navy-300 mb-3" />
        <h3 className="text-base font-semibold text-navy-700 mb-1">No topical worksheets yet</h3>
        <p className="text-sm text-navy-400 max-w-xs">
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
          <Link key={item.topic} href={`${basePath}/${slug}`} className="block group">
            <div className="card-hover bg-white border border-navy-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-navy-900 group-hover:text-gold-700 transition-colors truncate">
                  {item.topic}
                </h3>
                <p className="text-xs text-navy-400">{item.count} worksheet{item.count !== 1 ? 's' : ''}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-navy-300 group-hover:text-gold-500 group-hover:translate-x-1 transition-all shrink-0" />
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
        <div key={i} className="bg-white border border-navy-100 rounded-2xl p-5 animate-pulse flex items-center gap-4">
          <div className="w-11 h-11 bg-navy-100 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-navy-100 rounded-full w-3/4" />
            <div className="h-3 bg-navy-50 rounded-full w-1/3" />
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
      <div className="gradient-hero pb-12">
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
            <span className="text-gold-500 font-medium">Topical Worksheets</span>
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
