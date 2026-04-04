import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { STEM_CATEGORIES, getCategoryBySlug } from '@/config/stem';
import SimulationGrid from './SimulationGrid';

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

export default async function StemCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) notFound();
  return <SimulationGrid category={cat} />;
}
