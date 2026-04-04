import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { STEM_CATEGORIES, getCategoryBySlug } from '@/config/stem';
import { createAdminClient } from '@/lib/supabase/admin';
import SimulationGrid from './SimulationGrid';
import type { Simulation, StemCategory } from '@/config/stem';

export const revalidate = 60;

export function generateStaticParams() {
  return STEM_CATEGORIES.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) return { title: 'STEM' };
  return {
    title: `${cat.label} Simulations — STEM Hub`,
    description: cat.description,
  };
}

async function getDBSimulations(subject: string): Promise<Simulation[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('stem_simulations')
      .select('*')
      .eq('subject', subject)
      .eq('status', 'published')
      .order('sort_order', { ascending: true });

    if (!data || data.length === 0) return [];

    return data.map((row: any) => ({
      id: row.slug,
      title: row.title,
      description: row.description || '',
      icon: row.icon || 'Sparkles',
      gradient: row.gradient || 'from-blue-500 to-indigo-600',
      glowColor: row.glow_color || 'rgba(99,102,241,0.35)',
      difficulty: row.difficulty || 'Beginner',
      tags: row.tags || [],
      instructions: row.instructions || '',
      html_code: row.html_code || null,
    }));
  } catch {
    return [];
  }
}

export default async function StemCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) notFound();

  // Fetch DB simulations and merge with static ones
  const dbSims = await getDBSimulations(category);

  // DB simulations override static ones with the same ID, then append new ones
  const staticIds = new Set(cat.simulations.map((s) => s.id));
  const mergedSims = [
    ...cat.simulations.map((staticSim) => {
      const dbOverride = dbSims.find((d) => d.id === staticSim.id);
      return dbOverride || staticSim;
    }),
    ...dbSims.filter((d) => !staticIds.has(d.id)),
  ];

  const mergedCat: StemCategory = { ...cat, simulations: mergedSims };

  return <SimulationGrid category={mergedCat} />;
}
