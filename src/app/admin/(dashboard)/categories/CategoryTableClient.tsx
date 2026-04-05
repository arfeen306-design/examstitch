'use client';

import { useState, useTransition } from 'react';
import { deleteCategoryWithAction } from '../../actions';
import { useToast } from '@/components/ui/Toast';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function CategoryTableClient({ categories }: { categories: any[] }) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState<any>(null);
  const [deleteAction, setDeleteAction] = useState<'cascade' | 'reassign'>('cascade');
  const [reassignTargetId, setReassignTargetId] = useState('');

  const handleDeleteClick = (cat: any) => {
    setTargetCategory(cat);
    setDeleteAction('cascade');
    setReassignTargetId('');
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!targetCategory) return;
    
    if (deleteAction === 'reassign' && !reassignTargetId) {
      showToast({ message: 'Select a category to reassign resources to.', type: 'error' });
      return;
    }

    startTransition(async () => {
      const { success, error } = await deleteCategoryWithAction(
        targetCategory.id, 
        deleteAction, 
        reassignTargetId
      );
      
      if (success) {
        showToast({ message: 'Category deleted successfully.', type: 'success' });
        setDeleteModalOpen(false);
        setTargetCategory(null);
      } else {
        showToast({ message: error || 'Failed to delete category.', type: 'error' });
      }
    });
  };

  return (
    <>
      <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Current Topics</h3>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-[var(--border-subtle)] rounded-lg">
          <table className="w-full text-sm text-left align-middle">
            <thead className="text-xs uppercase bg-[var(--bg-surface)] text-[var(--text-muted)] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 border-b border-[var(--border-color)]/50">Subject</th>
                <th className="px-4 py-3 border-b border-[var(--border-color)]/50">Category Name</th>
                <th className="px-4 py-3 border-b border-[var(--border-color)]/50">Slug (URL)</th>
                <th className="px-4 py-3 border-b border-[var(--border-color)]/50">Resources</th>
                <th className="px-4 py-3 border-b border-[var(--border-color)]/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] bg-[var(--bg-card)]">
              {categories?.map((cat) => (
                <tr key={cat.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-[var(--text-muted)]">
                    {cat.subject?.name || '-'}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-[var(--text-primary)]">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-[var(--text-muted)]/80">
                    /{cat.slug}
                  </td>
                  <td className="px-4 py-3.5 text-[var(--text-muted)]">
                    {cat.resources?.[0]?.count || 0} items
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleDeleteClick(cat)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!categories?.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    No categories generated. Have you run the seed data script?
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && targetCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--border-subtle)] bg-red-50/50 flex gap-3 items-start">
              <div className="p-2 bg-red-100 text-red-600 rounded-full">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-900">Delete Category</h2>
                <p className="text-sm text-red-700/80 mt-1">
                  You are about to delete <strong>{targetCategory.name}</strong>.
                </p>
              </div>
              <button disabled={isPending} onClick={() => setDeleteModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-sm text-[var(--text-muted)]">
                This category contains <strong className="text-[var(--text-primary)]">{targetCategory.resources?.[0]?.count || 0}</strong> attached resources. What would you like to do with them?
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border border-[var(--border-color)] rounded-xl cursor-pointer hover:bg-[var(--bg-surface)] focus-within:ring-2 focus-within:ring-orange-500/50 transition-all">
                  <input 
                    type="radio" 
                    name="deleteAction" 
                    value="cascade" 
                    checked={deleteAction === 'cascade'} 
                    onChange={() => setDeleteAction('cascade')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-[var(--text-primary)] text-sm">Delete Everything (Cascade)</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">Permanently delete this category and all resources attached to it.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-[var(--border-color)] rounded-xl cursor-pointer hover:bg-[var(--bg-surface)] focus-within:ring-2 focus-within:ring-orange-500/50 transition-all">
                  <input 
                    type="radio" 
                    name="deleteAction" 
                    value="reassign" 
                    checked={deleteAction === 'reassign'} 
                    onChange={() => setDeleteAction('reassign')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-[var(--text-primary)] text-sm">Re-assign Resources</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5 mb-2">Move resources to another category before deleting this one.</div>
                    
                    {deleteAction === 'reassign' && (
                      <select 
                        value={reassignTargetId}
                        onChange={(e) => setReassignTargetId(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-sm border border-[var(--border-color)] rounded-lg focus:ring-orange-500/50 outline-none"
                      >
                        <option value="" disabled>Select Target Category...</option>
                        {categories
                          .filter(c => c.id !== targetCategory.id && c.subject_id === targetCategory.subject_id)
                          .map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))
                        }
                      </select>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border-subtle)] flex justify-end gap-3 bg-[var(--bg-surface)]">
              <button 
                disabled={isPending}
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={isPending}
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? 'Processing...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
