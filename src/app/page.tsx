/**
 * Homepage — Server Component
 * Fetches feed data server-side, passes to client component for rendering.
 */

import { createClient } from '@/lib/supabase/server';
import HomeClient, { type FeedItem } from '@/components/home/HomeClient';
import MediaSection from '@/components/media/MediaSection';

async function getFeedItems(): Promise<FeedItem[]> {
  try {
    const supabase = createClient();

    const [resourcesRes, blogsRes] = await Promise.all([
      supabase
        .from('resources')
        .select('id, title, content_type, created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('blogs')
        .select('id, title, content, image_url, created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const resourceItems: FeedItem[] = (resourcesRes.data ?? []).map(r => ({
      id: r.id,
      title: r.title,
      type: r.content_type as FeedItem['type'],
      created_at: r.created_at,
    }));

    const blogItems: FeedItem[] = (blogsRes.data ?? []).map(b => ({
      id: b.id,
      title: b.title,
      type: 'blog' as const,
      created_at: b.created_at,
      image_url: b.image_url,
      content: b.content,
    }));

    return [...resourceItems, ...blogItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  } catch {
    // If blogs table doesn't exist yet, return empty gracefully
    return [];
  }
}

export default async function HomePage() {
  const feedItems = await getFeedItems();
  return (
    <>
      <HomeClient feedItems={feedItems} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <MediaSection pageSlug="home" heading="Featured Videos & Resources" columns={2} />
      </div>
    </>
  );
}
