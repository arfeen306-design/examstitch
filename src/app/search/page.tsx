import { Suspense } from 'react';
import Link from 'next/link';
import { Search, Play, FileText, BookOpen } from 'lucide-react';
import { searchAllContent, getSuggestions } from '@/lib/supabase/queries';
import type { Resource, MediaWidget, BlogPost, Skill, SkillLesson } from '@/lib/supabase/types';
import { MODULE_TYPES, CONTENT_TYPES } from '@/lib/constants';


// ── Result card ────────────────────────────────────────────────────────────────

type SearchResource = Resource & {
  category?: { name: string; slug: string };
  worksheet_url?: string | null;
  module_type?: string;
};

function ResultCard({ resource }: { resource: SearchResource }) {
  const isVideo = resource.content_type === CONTENT_TYPES.VIDEO;
  const isPaper = resource.module_type === MODULE_TYPES.SOLVED_PAST_PAPER;
  const hasWorksheet = !!resource.worksheet_url;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3
                    px-5 py-4 rounded-xl border border-[var(--border-subtle)]
                    hover:border-gold-400/50 hover:shadow-md transition-all duration-150" style={{ backgroundColor: 'var(--bg-card)' }}>
      {/* Left: icon + title + category */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border
          ${isPaper ? 'bg-blue-50 text-blue-600 border-blue-100'
            : isVideo ? 'bg-red-50 text-red-500 border-red-100'
            : 'bg-green-50 text-green-600 border-green-100'}`}>
          {isPaper ? <FileText className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {resource.title}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {(resource.category as any)?.name || resource.subject || '—'}
          </p>
        </div>
      </div>

      {/* Right: action pills */}
      <div className="flex items-center gap-2 shrink-0 pl-11 sm:pl-0">
        {isPaper ? (
          <Link
            href={`/view/${resource.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5
                       bg-blue-600 hover:bg-blue-500 text-white
                       text-xs font-semibold rounded-full shadow-sm transition-all"
          >
            <FileText className="w-3 h-3" /> View Paper
          </Link>
        ) : (
          <>
            {/* Watch Video pill — always shown for video_topical */}
            <Link
              href={`/view/${resource.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5
                         bg-gold-500 hover:bg-gold-400 text-navy-900
                         text-xs font-semibold rounded-full shadow-sm transition-all whitespace-nowrap"
            >
              <Play className="w-3 h-3 fill-navy-900" /> Watch Video
            </Link>

            {/* Worksheet pill — only shown if worksheet_url exists */}
            {hasWorksheet && (
              <Link
                href={`/view/${resource.id}?mode=worksheet`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5
                border border-[var(--border-color)]
                           text-xs font-semibold rounded-full shadow-sm transition-all whitespace-nowrap" style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <FileText className="w-3 h-3" /> Worksheet
              </Link>
            )}
          </>
        )}
      </div>
    </div>
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
        <span className="ml-auto text-xs font-normal normal-case tracking-normal text-[var(--text-muted)]">
          {resources.length} result{resources.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {resources.map(r => <ResultCard key={r.id} resource={r as any} />)}
      </div>
    </div>
  );
}

function GenericSection<T>({
  title,
  icon,
  items,
  colorClass,
  renderItem,
}: {
  title: string;
  icon: React.ReactNode;
  items: T[];
  colorClass: string;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  if (!items.length) return null;
  return (
    <div>
      <div className={`flex items-center gap-2 mb-3 text-sm font-bold uppercase tracking-widest ${colorClass}`}>
        {icon}
        {title}
        <span className="ml-auto text-xs font-normal normal-case tracking-normal text-[var(--text-muted)]">
          {items.length} result{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => renderItem(item, idx))}
      </div>
    </div>
  );
}

// ── Results component ──────────────────────────────────────────────────────────

async function SearchResults({ query }: { query: string }) {
  let results = {
    videoTopical: [] as Resource[],
    solvedPapers: [] as Resource[],
    mediaWidgets: [] as MediaWidget[],
    blogPosts: [] as BlogPost[],
    skills: [] as Skill[],
    skillLessons: [] as SkillLesson[],
    total: 0,
  };
  let suggestions: string[] = [];

  try {
    [results, suggestions] = await Promise.all([
      searchAllContent(query),
      getSuggestions(query, 5),
    ]);
  } catch (e) {
    return (
      <div className="text-center py-10 text-[var(--text-muted)] text-sm">
        Search service unavailable. Please try again later.
      </div>
    );
  }

  if (results.total === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-navy-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">No results for &quot;{query}&quot;</h2>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          Try checking your spelling or searching for a broader topic.
        </p>
        {suggestions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
              Try searching for
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map(s => (
                <Link
                  key={s}
                  href={`/search?q=${encodeURIComponent(s)}`}
                  className="px-4 py-2 text-sm font-medium text-[var(--text-primary)]
                             border border-[var(--border-subtle)] rounded-full hover:border-gold-400
                             hover:text-gold-700 transition-all duration-150" style={{ backgroundColor: 'var(--bg-card)' }}
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
      <GenericSection
        title="Media Widgets (Videos/PDFs)"
        icon={<Play className="w-4 h-4" />}
        items={results.mediaWidgets}
        colorClass="text-purple-600"
        renderItem={(m) => (
          <a
            key={m.id}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 px-5 py-4 rounded-xl border border-[var(--border-subtle)] hover:border-purple-300 transition-all"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{m.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {m.media_type.toUpperCase()} · {m.page_slug}
              </p>
            </div>
            <span className="text-xs font-semibold text-purple-700">Open</span>
          </a>
        )}
      />
      <GenericSection
        title="Blog Content"
        icon={<BookOpen className="w-4 h-4" />}
        items={results.blogPosts}
        colorClass="text-emerald-600"
        renderItem={(post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="flex items-center justify-between gap-3 px-5 py-4 rounded-xl border border-[var(--border-subtle)] hover:border-emerald-300 transition-all"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{post.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Published blog post</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700">Read</span>
          </Link>
        )}
      />
      <GenericSection
        title="Digital Skills Tracks"
        icon={<BookOpen className="w-4 h-4" />}
        items={results.skills}
        colorClass="text-indigo-600"
        renderItem={(skill) => (
          <Link
            key={skill.id}
            href="/digital-skills"
            className="flex items-center justify-between gap-3 px-5 py-4 rounded-xl border border-[var(--border-subtle)] hover:border-indigo-300 transition-all"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{skill.name}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{skill.tagline || 'Digital skill track'}</p>
            </div>
            <span className="text-xs font-semibold text-indigo-700">Explore</span>
          </Link>
        )}
      />
      <GenericSection
        title="Digital Skills Lessons"
        icon={<Play className="w-4 h-4" />}
        items={results.skillLessons}
        colorClass="text-amber-600"
        renderItem={(lesson) => (
          <Link
            key={lesson.id}
            href="/digital-skills"
            className="flex items-center justify-between gap-3 px-5 py-4 rounded-xl border border-[var(--border-subtle)] hover:border-amber-300 transition-all"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{lesson.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {lesson.video_url ? 'Video lesson' : 'Lesson resource'}
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-700">Open</span>
          </Link>
        )}
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
            Search across all content tables: resources, videos, PDFs, blog, media widgets, and digital skills.
          </p>
          <form method="GET" action="/search" className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              name="q"
              defaultValue={query}
              autoFocus={!query}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-[var(--border-subtle)]
                         focus:outline-none focus:ring-2 focus:ring-gold-400 text-[var(--text-primary)]" style={{ backgroundColor: 'var(--bg-card)' }}
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
          <div className="text-center py-16 text-[var(--text-muted)]">
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
