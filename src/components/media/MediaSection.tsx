import { createClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/admin-mode';
import MediaFrame from './MediaFrame';

interface MediaSectionProps {
  pageSlug: string;
  /** Optional heading above the media grid */
  heading?: string;
  /** Number of columns on large screens (default 2) */
  columns?: 1 | 2 | 3;
  /** Subject context for themed borders */
  subject?: 'maths' | 'computer-science' | string;
}

const colClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
} as const;

/**
 * Server component that fetches media widgets for a page and renders them.
 * Drop this into any page layout — zero client JS overhead for fetching.
 */
export default async function MediaSection({
  pageSlug,
  heading,
  columns = 2,
  subject,
}: MediaSectionProps) {
  const supabase = createClient();
  const adminMode = isAdminRequest();

  const { data: widgets } = await supabase
    .from('media_widgets')
    .select('*')
    .eq('page_slug', pageSlug)
    .eq('is_active', true)
    .order('section_order', { ascending: true });

  if (!widgets || widgets.length === 0) return null;

  return (
    <section className="w-full">
      {heading && (
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {heading}
          </h2>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
        </div>
      )}
      <div className={`grid gap-6 ${colClasses[columns]}`}>
        {widgets.map((w) => (
          <MediaFrame
            key={w.id}
            id={w.id}
            mediaType={w.media_type as 'youtube' | 'pdf'}
            title={w.title}
            url={w.url}
            permissions={w.permissions as { allow_print: boolean; allow_download: boolean }}
            viewCount={(w as Record<string, unknown>).view_count as number | undefined}
            subject={subject}
            isAdmin={adminMode}
          />
        ))}
      </div>
    </section>
  );
}
