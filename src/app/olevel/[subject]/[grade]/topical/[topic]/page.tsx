import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import UnifiedModuleGrid, { type LearningModule } from '@/components/resources/UnifiedModuleGrid';
import {
  getCategoryBySlug,
  getResourcesByTopic,
  getTopicsByCategory,
} from '@/lib/supabase/queries';
import { isSupabaseConfigured } from '@/lib/supabase/is-configured';
import { getSubjectLabel } from '@/config/navigation';
import {
  getWorksheetBySlug,
  loadWorksheetMarkdown,
  type WorksheetEntry,
} from '@/lib/worksheets-registry';
import type { Resource } from '@/lib/supabase/types';

function formatGrade(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function topicSlug(topic: string): string {
  return topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ── Markdown worksheet view (preferred path) ─────────────────────────────────

function MarkdownWorksheet({ entry }: { entry: WorksheetEntry }) {
  const markdown = loadWorksheetMarkdown(entry);
  return (
    <article
      className="rounded-2xl p-6 sm:p-8 prose-worksheet"
      style={{
        background: 'rgba(8,14,28,0.65)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}

// ── Legacy DB-driven view (fallback when no markdown file exists) ────────────

async function resolveTopicName(
  subject: string,
  grade: string,
  slug: string,
): Promise<{ topicName: string; categoryId: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const category = await getCategoryBySlug(subject, grade);
  if (!category) return null;
  const topics = await getTopicsByCategory(category.id);
  const match = topics.find((t) => topicSlug(t.topic) === slug);
  if (!match) return null;
  return { topicName: match.topic, categoryId: category.id };
}

async function DbTopicResources({
  subject,
  grade,
  topic,
}: {
  subject: string;
  grade: string;
  topic: string;
}) {
  const resolved = await resolveTopicName(subject, grade, topic);
  if (!resolved) {
    return (
      <UnifiedModuleGrid
        modules={[]}
        emptyTitle="Topic not found"
        emptyMessage="This topic has no published worksheets yet."
      />
    );
  }
  const resources = await getResourcesByTopic(resolved.categoryId, resolved.topicName);
  const modules: LearningModule[] = resources.map((r) => ({
    id: r.id,
    title: r.title,
    videoUrl: r.source_url,
    worksheetUrl: (r as Resource & { worksheet_url?: string | null }).worksheet_url ?? null,
    isLocked: (r as Resource & { is_locked?: boolean }).is_locked ?? false,
    parentResourceId: (r as Resource & { parent_resource_id?: string | null }).parent_resource_id ?? null,
  }));
  return <UnifiedModuleGrid modules={modules} />;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function TopicDetailPage({
  params,
}: {
  params: { subject: string; grade: string; topic: string };
}) {
  const gradeName = formatGrade(params.grade);

  // Prefer the filesystem worksheet (markdown) over a DB lookup.
  // Worksheets in docs/worksheets/olevel-math/<grade>/ are the source of
  // truth for Mathematics topical content.
  const fsWorksheet =
    params.subject === 'mathematics-4024'
      ? getWorksheetBySlug(params.grade, params.topic)
      : null;

  // For DB-driven subjects (future), resolve against published resources.
  const dbResolved =
    !fsWorksheet && isSupabaseConfigured()
      ? await resolveTopicName(params.subject, params.grade, params.topic)
      : null;

  const topicLabel =
    fsWorksheet?.topic ??
    dbResolved?.topicName ??
    params.topic.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // 404 only when neither source has the topic.
  if (!fsWorksheet && !dbResolved && isSupabaseConfigured()) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="gradient-hero pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
            <Link href="/olevel" className="text-white/50 hover:text-white/70 transition-colors">O-Level / IGCSE</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">{getSubjectLabel(params.subject)}</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}/${params.grade}`} className="text-white/50 hover:text-white/70 transition-colors">{gradeName}</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}/${params.grade}/topical`} className="text-white/50 hover:text-white/70 transition-colors">Topical</Link>
            <span className="text-white/30">/</span>
            <span className="text-gold-500 font-medium">{topicLabel}</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg">
              {fsWorksheet ? <FileText className="w-4 h-4 text-white" /> : <BookOpen className="w-4 h-4 text-white" />}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{topicLabel}</h1>
          </div>
          <p className="text-white/60">
            {gradeName} — {fsWorksheet
              ? 'Cambridge-styled worksheet with concept summary, 10 exam-format questions, and a fully worked answer key.'
              : 'Focused worksheets and video walkthroughs for this topic.'}
          </p>
          <Link
            href={`/olevel/${params.subject}/${params.grade}`}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to {gradeName}
          </Link>
        </div>
      </div>

      <div className="portal-page-body portal-surface-navy max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        {fsWorksheet ? (
          <MarkdownWorksheet entry={fsWorksheet} />
        ) : (
          <Suspense fallback={<UnifiedModuleGrid modules={[]} isLoading={true} />}>
            <DbTopicResources subject={params.subject} grade={params.grade} topic={params.topic} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
