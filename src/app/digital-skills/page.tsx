import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import DigitalSkillsClient from './DigitalSkillsClient';

export const metadata: Metadata = {
  title: 'Digital Skills',
  description:
    'Master the future — interactive courses in Coding, Design, AI, and more. Cinematic learning experience by ExamStitch.',
};

export const revalidate = 60; // ISR: refresh every 60s

export default async function DigitalSkillsPage() {
  const supabase = createClient();

  // Fetch all active skills with nested playlists → lessons
  const { data: skills } = await supabase
    .from('skills')
    .select(`
      id, name, slug, icon, tagline, description,
      gradient, glow_color, is_active, sort_order,
      skill_playlists (
        id, title, description, sort_order,
        skill_lessons (
          id, title, video_url, duration, sort_order, is_free,
          notes_url, exercises_url, cheatsheet_url, quiz_url, resource_url
        )
      )
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // Sort nested arrays (Supabase doesn't guarantee nested order)
  const sortedSkills = (skills ?? []).map((skill) => ({
    ...skill,
    skill_playlists: (skill.skill_playlists ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((pl: any) => ({
        ...pl,
        skill_lessons: (pl.skill_lessons ?? []).sort(
          (a: any, b: any) => a.sort_order - b.sort_order,
        ),
      })),
  }));

  return <DigitalSkillsClient dbSkills={sortedSkills} />;
}
