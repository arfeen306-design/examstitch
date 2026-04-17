'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { quickSetupSubjectPortal } from '@/app/admin/[subject]/categories/actions';

export default function QuickSetupButton({
  subjectId,
  portalRouteSegment,
}: {
  subjectId: string;
  portalRouteSegment: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  const handleSetup = () => {
    startTransition(async () => {
      const result = await quickSetupSubjectPortal(subjectId, portalRouteSegment);
      if (!result.success) {
        showToast({ message: result.error, type: 'error' });
        return;
      }
      showToast({
        message: result.created > 0 ? `Quick setup complete: ${result.created} section(s) created.` : 'Quick setup already applied.',
        type: 'success',
      });
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleSetup}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg border border-amber-500/55 bg-slate-900/35 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/10 hover:border-amber-400/80 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <Sparkles className="h-4 w-4" aria-hidden />
      {isPending ? 'Setting up…' : 'Quick Setup'}
    </button>
  );
}
