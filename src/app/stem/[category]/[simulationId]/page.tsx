import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { STEM_CATEGORIES, getSimulation, getAllSimulations, getCategoryBySlug } from '@/config/stem';
import { createAdminClient } from '@/lib/supabase/admin';
import dynamic from 'next/dynamic';
import type { Simulation, StemCategory } from '@/config/stem';

const SimulationViewer = dynamic(
  () => import('@/components/stem/SimulationViewer'),
  { ssr: false },
);

export const revalidate = 60;

export function generateStaticParams() {
  return getAllSimulations().map((sim) => ({
    category: sim.category,
    simulationId: sim.id,
  }));
}

async function getDBSimulation(slug: string): Promise<(Simulation & { dbSubject?: string }) | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('stem_simulations')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (!data) return null;

    return {
      id: data.slug,
      title: data.title,
      description: data.description || '',
      icon: data.icon || 'Sparkles',
      gradient: data.gradient || 'from-blue-500 to-indigo-600',
      glowColor: data.glow_color || 'rgba(99,102,241,0.35)',
      difficulty: data.difficulty || 'Beginner',
      tags: data.tags || [],
      instructions: data.instructions || '',
      html_code: data.html_code || null,
      dbSubject: data.subject,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; simulationId: string }>;
}): Promise<Metadata> {
  const { category, simulationId } = await params;

  // Try DB first, then static
  const dbSim = await getDBSimulation(simulationId);
  if (dbSim) {
    return { title: `${dbSim.title} — STEM Lab`, description: dbSim.description };
  }

  const sim = getSimulation(category, simulationId);
  if (!sim) return { title: 'STEM Simulation' };
  return { title: `${sim.title} — STEM Lab`, description: sim.description };
}

export default async function SimulationPage({
  params,
}: {
  params: Promise<{ category: string; simulationId: string }>;
}) {
  const { category, simulationId } = await params;

  // Try DB first
  const dbSim = await getDBSimulation(simulationId);
  const cat = getCategoryBySlug(category);

  if (dbSim && cat) {
    return <SimulationViewer simulation={dbSim} category={cat} />;
  }

  // Fall back to static config
  const sim = getSimulation(category, simulationId);
  if (!sim || !cat) notFound();

  return <SimulationViewer simulation={sim} category={cat} />;
}
