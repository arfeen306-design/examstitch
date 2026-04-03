import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  getStudentAccountByAuthId, 
  getUserProgress, 
  countResourcesByLevel 
} from '@/lib/supabase/queries';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/dashboard');
  }

  const student = await getStudentAccountByAuthId(user.id);
  
  if (!student) {
    redirect('/');
  }

  // Fetch progress and total resources — gracefully degrade if tables/schema don't match
  let progress: Awaited<ReturnType<typeof getUserProgress>> = [];
  let totalResources = 0;
  try {
    [progress, totalResources] = await Promise.all([
      getUserProgress(student.id),
      countResourcesByLevel(student.level || 'olevel').catch(() => 0)
    ]);
  } catch {
    // user_progress or resource counting may fail — show empty dashboard
  }

  // Fetch unlocked skills
  let unlockedSkills: { id: string; name: string; slug: string; icon: string; gradient: string; description: string | null }[] = [];
  try {
    const admin = createAdminClient();
    const { data: access } = await admin
      .from('student_skill_access')
      .select('skill_id')
      .eq('student_id', student.id);

    if (access && access.length > 0) {
      const ids = access.map(a => a.skill_id);
      const { data: skills } = await admin
        .from('skills')
        .select('id, name, slug, icon, gradient, description')
        .in('id', ids)
        .eq('is_active', true)
        .order('sort_order');
      unlockedSkills = skills ?? [];
    }
  } catch {
    // Skills feature may not be set up yet
  }

  // Serialize progress for client component
  const serializedProgress = progress.map(p => ({
    id: p.id,
    is_completed: p.is_completed,
    last_viewed_at: p.last_viewed_at,
    resource: {
      id: p.resource.id,
      title: p.resource.title,
      description: p.resource.description || '',
      content_type: p.resource.content_type,
      subject: p.resource.subject,
    },
  }));

  return (
    <DashboardClient
      studentName={student.full_name}
      studentLevel={student.level || 'Unassigned'}
      progress={serializedProgress}
      totalResources={totalResources}
      unlockedSkills={unlockedSkills}
    />
  );
}
