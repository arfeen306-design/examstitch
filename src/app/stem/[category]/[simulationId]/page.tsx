import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { STEM_CATEGORIES, getSimulation, getAllSimulations } from '@/config/stem';
import { ChevronRight, Home, FlaskConical, Beaker } from 'lucide-react';

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
    title: `${sim.title} — STEM Hub`,
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
  const cat = STEM_CATEGORIES.find((c) => c.slug === category);
  if (!sim || !cat) notFound();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className={`absolute inset-0 bg-gradient-to-b ${cat.heroGradient}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm mb-8">
            <Link href="/" className="text-white/40 hover:text-white transition-colors">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-white/20" />
            <Link href="/stem" className="text-white/40 hover:text-white transition-colors font-medium">
              STEM
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-white/20" />
            <Link
              href={`/stem/${category}`}
              className="text-white/40 hover:text-white transition-colors font-medium"
            >
              {cat.label}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-white/20" />
            <span className="text-white/70 font-medium">{sim.title}</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            {sim.title}
          </h1>
          <p className="text-white/50 max-w-xl">{sim.description}</p>
        </div>
      </section>

      {/* Placeholder for Phase 2 renderer */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="flex flex-col items-center justify-center py-24 bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${sim.gradient} flex items-center justify-center mb-6 shadow-lg`}>
            <Beaker className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Simulation Coming Soon</h2>
          <p className="text-sm text-white/40 max-w-md text-center mb-6">
            The interactive 3D renderer for this simulation is being built in Phase 2.
            Check back soon!
          </p>
          <Link
            href={`/stem/${category}`}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-white/[0.1] hover:bg-white/[0.15] border border-white/[0.15] rounded-lg transition-colors"
          >
            Back to {cat.label}
          </Link>
        </div>
      </section>
    </div>
  );
}
