'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { seedDisciplineSubjectsFromApp } from '@/app/admin/super/actions';
import { useToast } from '@/components/ui/Toast';

export default function SeedDisciplineSubjectsButton({
  returnTo,
  className = '',
}: {
  /** Path to reload after success, e.g. /admin/physics */
  returnTo: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { showToast } = useToast();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await seedDisciplineSubjectsFromApp();
          if (r.success) {
            showToast({ message: 'Subjects created. Reloading…', type: 'success' });
            router.push(returnTo);
            router.refresh();
          } else {
            showToast({ message: r.error, type: 'error' });
          }
        })
      }
      className={
        className ||
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border border-emerald-500/45 text-emerald-200/95 bg-emerald-500/10 hover:bg-emerald-500/15 transition disabled:opacity-50'
      }
    >
      {pending ? 'Working…' : 'Create subjects in database (one click)'}
    </button>
  );
}
