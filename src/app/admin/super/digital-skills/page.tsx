import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/supabase/guards';
import { redirect } from 'next/navigation';
import DigitalSkillsManager from './DigitalSkillsManager';

export const dynamic = 'force-dynamic';

export default async function DigitalSkillsAdminPage() {
  const session = await requireSuperAdmin();
  if (!session) redirect('/admin/login');

  const supabase = createAdminClient();

  // Fetch all skills with nested playlists → lessons
  const { data: skills } = await supabase
    .from('skills')
    .select('*')
    .order('sort_order', { ascending: true });

  const { data: playlists } = await supabase
    .from('skill_playlists')
    .select('*')
    .order('sort_order', { ascending: true });

  const { data: lessons } = await supabase
    .from('skill_lessons')
    .select('*')
    .order('sort_order', { ascending: true });

  // Count students with access per skill
  const { data: accessCounts } = await supabase
    .from('student_skill_access')
    .select('skill_id');

  const skillAccessMap: Record<string, number> = {};
  for (const row of accessCounts ?? []) {
    skillAccessMap[row.skill_id] = (skillAccessMap[row.skill_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Digital Skills Manager</h2>
        <p className="text-sm text-white/40 mt-1">
          Create and manage skill tracks, playlists, and lessons.
        </p>
      </div>

      <DigitalSkillsManager
        initialSkills={skills ?? []}
        initialPlaylists={playlists ?? []}
        initialLessons={lessons ?? []}
        skillAccessCounts={skillAccessMap}
      />
    </div>
  );
}
