import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { STEM_CATEGORIES, getSimulation, getAllSimulations, getCategoryBySlug } from '@/config/stem';
import dynamic from 'next/dynamic';

const SimulationViewer = dynamic(
  () => import('@/components/stem/SimulationViewer'),
  { ssr: false },
);

export function generateStaticParams() {
  return getAllSimulations().map((sim) => ({
    category: sim.category,
    simulationId: sim.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; simulationId: string }>;
}): Promise<Metadata> {
  const { category, simulationId } = await params;
  const sim = getSimulation(category, simulationId);
  if (!sim) return { title: 'STEM Simulation' };
  return {
    title: `${sim.title} — STEM Lab`,
    description: sim.description,
  };
}

export default async function SimulationPage({
  params,
}: {
  params: Promise<{ category: string; simulationId: string }>;
}) {
  const { category, simulationId } = await params;
  const sim = getSimulation(category, simulationId);
  const cat = getCategoryBySlug(category);
  if (!sim || !cat) notFound();

  return <SimulationViewer simulation={sim} category={cat} />;
}
