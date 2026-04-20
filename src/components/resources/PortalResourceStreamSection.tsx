import UnifiedModuleGrid from '@/components/resources/UnifiedModuleGrid';
import type { LearningModule } from '@/components/resources/UnifiedModuleGrid';
import ResourceGrid from '@/components/resources/ResourceGrid';
import type { ResourceItem } from '@/components/resources/ResourceGrid';
import { getCategoryBySlug, getPublishedResourcesByModuleStream } from '@/lib/supabase/queries';
import { isSupabaseConfigured } from '@/lib/supabase/is-configured';
import type { Resource } from '@/lib/supabase/types';
import { isAdminRequest } from '@/lib/admin-mode';
import type { PortalResourceStreamModuleType } from '@/lib/init-subject';

function toPastPaperItem(resource: Resource, basePath: string, adminBypass: boolean): ResourceItem {
  const examSeries = (resource as Resource & {
    exam_series?: { year: number; session: string; variant: number } | null;
  }).exam_series;
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description ?? undefined,
    contentType: resource.content_type,
    href: `/view/${resource.id}`,
    year: examSeries?.year,
    session: examSeries?.session,
    variant: examSeries?.variant,
    subject: resource.subject,
    isLocked: adminBypass ? false : ((resource as { is_locked?: boolean }).is_locked ?? false),
  };
}

export type PortalResourceStreamLayout = 'video-modules' | 'past-paper-cards';

interface PortalResourceStreamSectionProps {
  subjectSlug: string;
  categorySlug: string;
  moduleType: PortalResourceStreamModuleType;
  layout: PortalResourceStreamLayout;
  /** Base path for demo / legacy href construction on olevel past papers */
  basePath?: string;
  emptyVideoTitle?: string;
  emptyVideoMessage?: string;
  emptyPastTitle?: string;
  emptyPastMessage?: string;
}

/**
 * Single server entry for subject portals: fetches **only** rows matching `module_type`.
 * Used by Video Lectures and Solved Past Papers routes so streams never cross-contaminate.
 */
export default async function PortalResourceStreamSection({
  subjectSlug,
  categorySlug,
  moduleType,
  layout,
  basePath = '',
  emptyVideoTitle = 'No video lectures yet',
  emptyVideoMessage = 'Upload your first video lecture via the admin dashboard.',
  emptyPastTitle = 'No past papers yet',
  emptyPastMessage = 'Upload your first past paper via the admin dashboard.',
}: PortalResourceStreamSectionProps) {
  if (!isSupabaseConfigured()) {
    if (layout === 'video-modules') {
      return (
        <UnifiedModuleGrid
          modules={[]}
          emptyTitle="Database not configured"
          emptyMessage="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        />
      );
    }
    return (
      <ResourceGrid
        resources={[]}
        emptyTitle="Database not configured"
        emptyMessage="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      />
    );
  }

  try {
    const category = await getCategoryBySlug(subjectSlug, categorySlug);
    if (!category) {
      if (layout === 'video-modules') {
        return (
          <UnifiedModuleGrid modules={[]} emptyTitle="Category not found" emptyMessage="Run the SQL migrations first." />
        );
      }
      return (
        <ResourceGrid resources={[]} emptyTitle="Category not found" emptyMessage="Run the SQL migrations first." />
      );
    }

    const resources = await getPublishedResourcesByModuleStream(category.id, moduleType);
    const adminBypass = isAdminRequest();

    if (layout === 'video-modules') {
      const modules: LearningModule[] = resources.map((r) => ({
        id: r.id,
        title: r.title,
        videoUrl: r.source_url,
        worksheetUrl: (r as { worksheet_url?: string | null }).worksheet_url || null,
        isLocked: adminBypass ? false : ((r as { is_locked?: boolean }).is_locked ?? false),
        parentResourceId: (r as { parent_resource_id?: string | null }).parent_resource_id ?? null,
      }));

      return (
        <UnifiedModuleGrid modules={modules} emptyTitle={emptyVideoTitle} emptyMessage={emptyVideoMessage} />
      );
    }

    const items: ResourceItem[] = resources.map((r) => toPastPaperItem(r as Resource, basePath, adminBypass));
    return <ResourceGrid resources={items} emptyTitle={emptyPastTitle} emptyMessage={emptyPastMessage} />;
  } catch (err) {
    console.error('PortalResourceStreamSection error:', err);
    if (layout === 'video-modules') {
      return (
        <UnifiedModuleGrid modules={[]} emptyTitle="Failed to load" emptyMessage="Please refresh the page." />
      );
    }
    return <ResourceGrid resources={[]} emptyTitle="Failed to load" emptyMessage="Please refresh the page." />;
  }
}
