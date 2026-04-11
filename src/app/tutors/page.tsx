import { createAdminClient } from '@/lib/supabase/admin';
import TutorsDiscoveryClient, { type TutorListItem } from '@/components/tutors/TutorsDiscoveryClient';

export const dynamic = 'force-dynamic';

export default async function TutorsPage() {
  const supabase = createAdminClient();
  const { data: tutors } = await supabase
    .from('tutors')
    .select('id, full_name, slug, thumbnail_url, hook_intro, specialties, locations, is_verified')
    .eq('is_verified', true)
    .order('full_name');

  const list = (tutors ?? []) as TutorListItem[];

  return <TutorsDiscoveryClient tutors={list} />;
}
