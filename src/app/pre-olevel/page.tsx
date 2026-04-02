import PreOLevelHero from './PreOLevelHero';
import MediaSection from '@/components/media/MediaSection';
import { createClient } from '@/lib/supabase/server';

export default async function PreOLevelPage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from('media_widgets')
    .select('id', { count: 'exact', head: true })
    .eq('page_slug', 'pre-o-level')
    .eq('is_active', true);

  const hasContent = (count ?? 0) > 0;

  return (
    <div className="min-h-screen pt-24 pb-16">
      {!hasContent && <PreOLevelHero />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <MediaSection pageSlug="pre-o-level" heading="Pre O-Level Videos & Materials" columns={2} />
      </div>
    </div>
  );
}
