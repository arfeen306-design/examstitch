import PreOLevelHero from './PreOLevelHero';
import MediaSection from '@/components/media/MediaSection';

export default async function PreOLevelPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <PreOLevelHero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <MediaSection pageSlug="pre-o-level" heading="Pre O-Level Videos & Materials" columns={2} />
      </div>
    </div>
  );
}
