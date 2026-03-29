import { Suspense } from 'react';
import Link from 'next/link';
import { Search, Play, FileText, BookOpen, ArrowRight } from 'lucide-react';
import { searchResourcesCategorised } from '@/lib/supabase/queries';
import type { Resource } from '@/lib/supabase/types';

// ── Related suggestions shown when zero results ───────────────────────────────

const SUGGESTIONS = [
  'Differentiation', 'Integration', 'Trigonometry', 'Statistics',
  'Probability', 'Algebra', 'Quadratics', 'Vectors', 'Mechanics',
  'Coordinate Geometry', 'Series', 'Logarithms',
];

function pickSuggestions(query: string, count = 4): string[] {
  const lower = query.toLowerCase();
  const filtered = SUGGESTIONS.filter(s => !s.toLowerCase().includes(lower));
  return filtered.slice(0, count);
}

// ── Result card ────────────────────────────────────────────────────────────────

function ResultCard({ resource }: { resource: Resource & { category?: { name: string; slug: string } } }) {
  const isVideo = resource.content_type === 'video';
  const isPaper = (resource as any).module_type === 'solved_past_paper';

  const icon = isVideo ? <Play className="w-4 h-4" /> : <FileText className="w-4 h-4" />;
  const badge = isVideo
    ? { label: 'Video Lecture', color: 'bg-red-50 text-red-600 border-red-100' }
    : isPaper
    ? { label: 'Past Paper', color: 'bg-blue-50 text-blue-600 border-blue-100' }
    : { label: 'Worksheet', color: 'bg-green-50 text-green-600 border-green-100' };

  return (
    <Link
      href={`/view/${resource.id}`}
      className="group flex items-center justify-between gap-4 px-5 py-4
                 bg-white rounded-xl border border-navy-100 hover:border-gold-400/50
                 hover:shadow-md transition-all duration-150"
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
                          border ${badge.color}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy-900 truncate group-hover:text-gold-600 transition-colors">
            {resource.title}
          </p>
          <p className="text-xs text-navy-400 mt-0.5">
            {resource.category?.name || resource.subject || '—'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-full border ${badge.color}`}>
          {badge.label}
        </span>
        <ArrowRight className="w-4 h-4 text-navy-300 group-hover:text-gold-500 transition-colors" />
      </div>
    </Link>
  );
}

// ── Section block ──────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  resources,
  colorClass,
}: {
  title: string;
  icon: React.ReactNode;
  resources: Resource[];
  colorClass: string;
}) {
  if (!resources.length) return null;
  return (
    <div>
      <div className={`flex items-center gap-2 mb-3 text-sm font-bold uppercase tracking-widest ${colorClass}`}>
        {icon}
        {title}
        <span className="ml-auto text-xs font-normal normal-case tracking-normal text-navy-400">
          {resources.length} result{resources.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {resources.map(r => <ResultCard key={r.id} resource={r as any} />)}
      </div>
    </div>
  );
}

// ── Results component ──────────────────────────────────────────────────────────

async function SearchResults({ query }: { query: string }) {
  let results = { videoTopical: [] as Resource[], solvedPapers: [] as Resource[], total: 0 };

  try {
    results = await searchResourcesCategorised(query);
  } catch (e) {
    return (
      <div className="text-center py-10 text-navy-400 text-sm">
        Search service unavailable. Please try again later.
      </div>
    );
  }

  if (results.total === 0) {
    const suggestions = pickSuggestions(query);
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-navy-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-navy-300" />
        </div>
        <h2 className="text-lg font-bold text-navy-900 mb-1">No results for "{query}"</h2>
        <p className="text-sm text-navy-400 mb-8">
          Try checking your spelling or searching for a broader topic.
        </p>
        {suggestions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-navy-400 mb-3">
              Try searching for
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map(s => (
                <Link
                  key={s}
                  href={`/search?q=${encodeURIComponent(s)}`}
                  className="px-4 py-2 text-sm font-medium text-navy-700 bg-white
                             border border-navy-100 rounded-full hover:border-gold-400
                             hover:text-gold-700 transition-all duration-150"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Section
        title="Video Lectures & Worksheets"
        icon={<Play className="w-4 h-4" />}
        resources={results.videoTopical}
        colorClass="text-red-600"
      />
      <Section
        title="Solved Past Papers"
        icon={<FileText className="w-4 h-4" />}
        resources={results.solvedPapers}
        colorClass="text-blue-600"
      />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = (searchParams.q || '').trim();

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Hero */}
      <div className="gradient-hero py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            {query ? `Results for "${query}"` : 'Search Resources'}
          </h1>
          <p className="text-white/60 text-sm mb-6">
            Search across all video lectures, worksheets, and past papers.
          </p>
          <form method="GET" action="/search" className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              name="q"
              defaultValue={query}
              autoFocus={!query}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-navy-100 bg-white
                         focus:outline-none focus:ring-2 focus:ring-gold-400 text-navy-900"
              placeholder="e.g. Differentiation, Chain Rule, May 2024..."
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gold-500 hover:bg-gold-400
                         text-navy-900 font-semibold text-xs px-3.5 py-2 rounded-lg transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-8">
        {query ? (
          <Suspense
            fallback={
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-navy-50 rounded-xl animate-pulse" />
                ))}
              </div>
            }
          >
            <SearchResults query={query} />
          </Suspense>
        ) : (
          <div className="text-center py-16 text-navy-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-navy-200" />
            <p className="text-sm">Type a topic above to search all resources.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Search Resources — ExamStitch',
  description: 'Search all A-Level and O-Level video lectures, worksheets, and past papers on ExamStitch.',
};
