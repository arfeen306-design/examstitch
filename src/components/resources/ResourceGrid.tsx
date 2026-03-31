'use client';

import { motion } from 'framer-motion';
import { FileSearch, Loader2 } from 'lucide-react';
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
    <div className="rounded-2xl p-5 animate-pulse" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-11 h-11 rounded-xl" style={{ backgroundColor: 'var(--border-subtle)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-4 rounded-full w-1/3" style={{ backgroundColor: 'var(--border-subtle)' }} />
          <div className="h-4 rounded-full w-3/4" style={{ backgroundColor: 'var(--border-subtle)' }} />
          <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: 'var(--bg-surface)' }} />
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
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <FileSearch className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
      <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>{message}</p>
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
