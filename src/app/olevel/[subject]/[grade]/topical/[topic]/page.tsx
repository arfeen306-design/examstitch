import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import UnifiedModuleGrid, { type LearningModule } from '@/components/resources/UnifiedModuleGrid';
import {
  getCategoryBySlug,
  getResourcesByTopic,
  getTopicsByCategory,
} from '@/lib/supabase/queries';
import { isSupabaseConfigured } from '@/lib/supabase/is-configured';
import { getSubjectLabel } from '@/config/navigation';
import type { Resource } from '@/lib/supabase/types';

function formatGrade(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function topicSlug(topic: string): string {
  return topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

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

async function TopicResources({
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
        emptyMessage="This topic has no published worksheets yet — try another topic from the index."
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
  return (
    <UnifiedModuleGrid
      modules={modules}
      emptyTitle={`No worksheets for "${resolved.topicName}" yet`}
      emptyMessage="Worksheets for this topic will appear here once uploaded."
    />
  );
}

export default async function TopicDetailPage({
  params,
}: {
  params: { subject: string; grade: string; topic: string };
}) {
  const gradeName = formatGrade(params.grade);
  // Best-effort resolve topic name for header — fall back to title-cased slug
  const resolved = isSupabaseConfigured()
    ? await resolveTopicName(params.subject, params.grade, params.topic)
    : null;
  const topicLabel =
    resolved?.topicName ??
    params.topic.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // If Supabase is configured but the topic does not exist for this category,
  // surface a proper 404 rather than a misleading empty grid.
  if (isSupabaseConfigured() && !resolved) {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{topicLabel}</h1>
          <p className="text-white/60">{gradeName} — focused worksheets and video walkthroughs for this topic.</p>
        </div>
      </div>

      <div className="portal-page-body portal-surface-navy max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <Suspense fallback={<UnifiedModuleGrid modules={[]} isLoading={true} />}>
          <TopicResources subject={params.subject} grade={params.grade} topic={params.topic} />
        </Suspense>
      </div>
    </div>
  );
}
