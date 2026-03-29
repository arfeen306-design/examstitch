'use client';

import { useState, useTransition } from 'react';
import { toggleResourceFlag, deleteResource } from '../../actions';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import NewResourceModal from './NewResourceModal';
import { useToast } from '@/components/ui/Toast';

interface Resource {
  id: string;
  title: string;
  subject: string;
  content_type: string;
  topic: string | null;
  category: { name: string; slug: string } | null;
  is_published: boolean;
  is_locked: boolean;
  is_watermarked: boolean;
  exam_series: any;
  created_at: string;
}

export default function ResourceGridClient({ initialResources }: { initialResources: Resource[] }) {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  const filtered = filterSubject === 'all' 
    ? resources 
    : resources.filter(r => r.subject === filterSubject);

  const handleToggle = (id: string, field: 'is_published' | 'is_locked' | 'is_watermarked', currentValue: boolean) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, [field]: !currentValue } : r));

    startTransition(async () => {
      const { success } = await toggleResourceFlag(id, field, !currentValue);
      if (!success) {
        setResources(prev => prev.map(r => r.id === id ? { ...r, [field]: currentValue } : r));
        showToast({ message: `Failed to update ${field}`, type: 'error' });
      } else {
        showToast({ message: `Updated ${field}`, type: 'success' });
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    
    startTransition(async () => {
      const { success, error } = await deleteResource(id);
      if (success) {
        setResources(prev => prev.filter(r => r.id !== id));
        showToast({ message: 'Resource deleted', type: 'success' });
      } else {
        showToast({ message: error || 'Failed to delete resource', type: 'error' });
      }
    });
  };

  const getLiveLink = (resource: Resource) => {
    const board = resource.subject.includes('9709') ? 'alevel' : 'olevel';
    return `/${board}/${resource.subject}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-4">
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="border border-navy-100 rounded-lg px-3 py-2 text-sm text-navy-700 focus:ring-1 focus:ring-gold-500 outline-none"
          >
            <option value="all">All Syllabi</option>
            <option value="mathematics-4024">O-Level (4024)</option>
            <option value="mathematics-9709">A-Level (9709)</option>
          </select>
          <div className="text-sm text-navy-400">
            Showing {filtered.length} resources
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Resource
        </button>
      </div>

      <div className="overflow-x-auto border border-navy-50 rounded-lg max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm text-left align-middle">
          <thead className="text-xs uppercase bg-navy-50 text-navy-500 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Subject / Cat</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-center">Published</th>
              <th className="px-4 py-3 text-center">Locked</th>
              <th className="px-4 py-3 text-center">Watermarked</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50 bg-white">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-navy-900 max-w-[200px] truncate" title={r.title}>
                  {r.title}
                </td>
                <td className="px-4 py-3 text-xs text-navy-500">
                  <div className="font-semibold">{r.subject.replace('mathematics-', '')}</div>
                  <div className="truncate w-32" title={r.category?.name || 'Uncategorized'}>{r.category?.name || 'Uncategorized'}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full text-xs font-mono uppercase">
                    {r.content_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <input 
                    type="checkbox" 
                    checked={r.is_published}
                    onChange={() => handleToggle(r.id, 'is_published', r.is_published)}
                    className="w-4 h-4 text-gold-600 rounded focus:ring-gold-500 cursor-pointer accent-gold-500"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input 
                    type="checkbox" 
                    checked={r.is_locked}
                    onChange={() => handleToggle(r.id, 'is_locked', r.is_locked)}
                    className="w-4 h-4 text-red-500 rounded focus:ring-red-500 cursor-pointer accent-red-500"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input 
                    type="checkbox" 
                    checked={r.is_watermarked}
                    onChange={() => handleToggle(r.id, 'is_watermarked', r.is_watermarked)}
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 cursor-pointer accent-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <a 
                      href={getLiveLink(r)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-navy-400 hover:text-gold-500 transition-colors"
                      title="Live View"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={() => handleDelete(r.id, r.title)}
                      className="text-navy-400 hover:text-red-500 transition-colors"
                      title="Delete Resource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-navy-400">
                  No resources found match criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NewResourceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          // To fetch new data automatically, we just let nextJS finish the server action revalidate path,
          // but if we want instant local, we do nothing. Revalidation handles the data refresh on the route.
        }} 
      />
    </div>
  );
}
