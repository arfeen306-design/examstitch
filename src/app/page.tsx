/**
 * Homepage — Server Component
 * Fetches feed data + media widgets server-side, passes to client components.
 */

import { createClient } from '@/lib/supabase/server';
import dynamic from 'next/dynamic';
import type { FeedItem } from '@/components/home/HomeClient';
import { isAdminRequest } from '@/lib/admin-mode';

const HomeClient = dynamic(() => import('@/components/home/HomeClient'), { ssr: false });
const VideoCarousel = dynamic(() => import('@/components/home/VideoCarousel'), { ssr: false });

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
    return [];
  }
}

async function getMediaWidgets() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('media_widgets')
      .select('id, media_type, title, url, view_count, page_slug')
      .eq('page_slug', 'home')
      .eq('is_active', true)
      .order('section_order', { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [feedItems, widgets] = await Promise.all([getFeedItems(), getMediaWidgets()]);
  const adminMode = isAdminRequest();

  return (
    <>
      <HomeClient feedItems={feedItems} />
      <VideoCarousel widgets={widgets} isAdmin={adminMode} />
    </>
  );
}
