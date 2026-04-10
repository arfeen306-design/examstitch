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

interface SubjectProgress {
  subjectName: string;
  subjectSlug: string;
  viewed: number;
  total: number;
}

interface RecommendedResource {
  id: string;
  title: string;
  categoryName: string;
}

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

  // ── Per-subject completion progress ────────────────────────────────────────
  let subjectProgress: SubjectProgress[] = [];
  try {
    const admin = createAdminClient();
    // Get categories where the student has viewed resources
    const viewedResourceIds = new Set(progress.map(p => p.resource.id));
    const viewedCategoryIds = new Set(
      progress.map(p => (p.resource as any).category_id).filter(Boolean)
    );

    // Get all subject_papers (subjects the student might be studying)
    const { data: papers } = await admin
      .from('subject_papers')
      .select('id, name, slug, parent_subject_id');

    if (papers && papers.length > 0) {
      // Get subjects (parent) for the student's level
      const { data: subjects } = await admin
        .from('subjects')
        .select('id, name, slug');

      const subjectMap = new Map((subjects ?? []).map(s => [s.id, s]));

      // For each subject the student has progress in, count viewed vs total
      const subjectIds = new Set(
        progress.map(p => p.resource.subject_id ?? (p.resource as any).subject_id).filter(Boolean)
      );

      for (const sid of subjectIds) {
        // Find the subject name from parent subjects table
        const paper = papers.find(p => p.parent_subject_id === sid || p.id === sid);
        const subject = subjectMap.get(sid as string);
        const name = subject?.name || paper?.name || 'Unknown';
        const slug = subject?.slug || paper?.slug || '';

        // Count total published resources for this subject
        const { count: total } = await admin
          .from('resources')
          .select('id', { count: 'exact', head: true })
          .eq('subject_id', sid as string)
          .eq('is_published', true);

        // Count how many the student has viewed
        const { data: subjectResources } = await admin
          .from('resources')
          .select('id')
          .eq('subject_id', sid as string)
          .eq('is_published', true);

        const viewed = (subjectResources ?? []).filter(r => viewedResourceIds.has(r.id)).length;

        if ((total ?? 0) > 0) {
          subjectProgress.push({ subjectName: name, subjectSlug: slug, viewed, total: total ?? 0 });
        }
      }
    }
  } catch {
    // Graceful — show empty
  }

  // ── Recommended next resources ─────────────────────────────────────────────
  let recommended: RecommendedResource[] = [];
  try {
    const admin = createAdminClient();
    const viewedIds = progress.map(p => p.resource.id);

    // Find categories the student has accessed
    const viewedCatIds = [
      ...new Set(
        progress
          .map(p => (p.resource as any).category_id)
          .filter(Boolean)
      ),
    ];

    if (viewedCatIds.length > 0) {
      // Get unviewed resources in the same categories
      let query = admin
        .from('resources')
        .select('id, title, category:categories(name)')
        .eq('is_published', true)
        .in('category_id', viewedCatIds)
        .limit(20);

      const { data: candidates } = await query;

      if (candidates) {
        recommended = candidates
          .filter(r => !viewedIds.includes(r.id))
          .slice(0, 3)
          .map(r => ({
            id: r.id,
            title: r.title,
            categoryName: (r.category as any)?.name ?? 'Uncategorized',
          }));
      }
    }
  } catch {
    // Graceful
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
      subjectProgress={subjectProgress}
      recommended={recommended}
    />
  );
}
