'use client';

import { useState, useTransition } from 'react';
import { createCategory } from '../../actions';
import { useToast } from '@/components/ui/Toast';
import { Plus } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  slug: string;
}

export default function CategoryManagerClient({ subjects }: { subjects: Subject[] }) {
  const [formData, setFormData] = useState({ name: '', slug: '', subject_id: '' });
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleSlugify = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.subject_id) {
      showToast({ message: 'All fields are required.', type: 'error' });
      return;
    }

    startTransition(async () => {
      const { success, error } = await createCategory(formData);
      if (success) {
        showToast({ message: 'Category added successfully!', type: 'success' });
        setFormData({ name: '', slug: '', subject_id: formData.subject_id });
      } else {
        showToast({ message: error || 'Failed to create category', type: 'error' });
      }
    });
  };

  return (
    <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-subtle)] mb-8">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Add Taxonomy Mapping</h3>
      
      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full relative group">
          <label className="block text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase mb-1.5 ml-1 transition-colors group-focus-within:text-gold-500">
            Syllabus
          </label>
          <select 
            required
            value={formData.subject_id}
            onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
            className="w-full px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-orange-500/50/20 focus:border-orange-500/50 focus:bg-[var(--bg-card)] outline-none transition-all shadow-sm shadow-navy-900/5 appearance-none"
          >
            <option value="" disabled>Select Subject...</option>
            {subjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full relative group">
          <label className="block text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase mb-1.5 ml-1 transition-colors group-focus-within:text-gold-500">
            Topic Name
          </label>
          <input 
            required
            placeholder="e.g. Differentiation"
            value={formData.name}
            onChange={e => {
              const name = e.target.value;
              setFormData({ ...formData, name, slug: handleSlugify(name) });
            }}
            className="w-full px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-orange-500/50/20 focus:border-orange-500/50 focus:bg-[var(--bg-card)] outline-none transition-all shadow-sm shadow-navy-900/5 placeholder:text-[var(--text-muted)]"
          />
        </div>

        <div className="flex-1 w-full relative group">
          <label className="block text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase mb-1.5 ml-1 transition-colors group-focus-within:text-gold-500">
            URL Slug
          </label>
          <input 
            required
            placeholder="e.g. differentiation"
            value={formData.slug}
            onChange={e => setFormData({ ...formData, slug: handleSlugify(e.target.value) })}
            className="w-full px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-orange-500/50/20 focus:border-orange-500/50 focus:bg-[var(--bg-card)] outline-none font-mono text-sm transition-all shadow-sm shadow-navy-900/5 placeholder:text-[var(--text-muted)]"
          />
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 text-[var(--text-primary)] px-6 py-2.5 shadow-sm shadow-navy-900/20 rounded-xl text-sm font-medium transition-all disabled:opacity-50 hover:shadow-md active:scale-95 border border-navy-700/50"
        >
          {isPending ? 'Saving...' : <><Plus className="w-4 h-4" /> Add Topic</>}
        </button>
      </form>
    </div>
  );
}
