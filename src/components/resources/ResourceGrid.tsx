'use client';

import { motion } from 'framer-motion';
import { FileSearch } from 'lucide-react';
import ResourceCard from './ResourceCard';

export interface ResourceItem {
  id: string;
  title: string;
  description?: string;
  contentType: 'video' | 'pdf' | 'worksheet';
  href: string;
  year?: number;
  session?: string;
  variant?: number;
  subject?: string;
  isLocked?: boolean;
}

interface ResourceGridProps {
  resources: ResourceItem[];
  columns?: 2 | 3;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 animate-pulse bg-white/[0.04] border border-white/[0.08]">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-11 h-11 rounded-xl bg-white/[0.08]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 rounded-full w-1/3 bg-white/[0.08]" />
          <div className="h-4 rounded-full w-3/4 bg-white/[0.06]" />
          <div className="h-3 rounded-full w-1/2 bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mb-4">
        <FileSearch className="w-8 h-8 text-white/30" />
      </div>
      <h3 className="text-base font-semibold text-white/60 mb-1">{title}</h3>
      <p className="text-sm text-white/30 max-w-xs">{message}</p>
    </motion.div>
  );
}

export default function ResourceGrid({
  resources,
  columns = 3,
  isLoading = false,
  emptyTitle = 'No resources yet',
  emptyMessage = 'Resources will appear here once they are uploaded.',
}: ResourceGridProps) {
  const gridCols = columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3';

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!resources.length) {
    return (
      <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
      {resources.map((resource, index) => (
        <ResourceCard
          key={resource.id}
          title={resource.title}
          description={resource.description}
          contentType={resource.contentType}
          href={resource.href}
          year={resource.year}
          session={resource.session}
          variant={resource.variant}
          subject={resource.subject}
          isLocked={resource.isLocked}
          index={index}
        />
      ))}
    </div>
  );
}
