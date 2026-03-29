'use client';

import { useState, useTransition } from 'react';
import { toggleResourceFlag, deleteResource, updateResource } from '../../actions';
import { ExternalLink, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import NewResourceModal from './NewResourceModal';
import { useToast } from '@/components/ui/Toast';

interface Resource {
  id: string;
  title: string;
  subject: string;
  content_type: string;
  source_url?: string;
  topic: string | null;
  category: { name: string; slug: string } | null;
  is_published: boolean;
  is_locked: boolean;
  is_watermarked: boolean;
  created_at: string;
}

export default function ResourceGridClient({ initialResources }: { initialResources: Resource[] }) {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editType, setEditType] = useState('');

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
      try {
        const result = await deleteResource(id);
        if (result.success) {
          setResources(prev => prev.filter(r => r.id !== id));
          showToast({ message: 'Resource deleted', type: 'success' });
        } else {
          showToast({ message: result.error || 'Failed to delete resource', type: 'error' });
        }
      } catch (err: any) {
        showToast({ message: 'Delete failed: ' + (err.message || 'Unknown error'), type: 'error' });
      }
    });
  };

  const startEdit = (r: Resource) => {
    setEditingId(r.id);
    setEditTitle(r.title);
    setEditUrl(r.source_url || '');
    setEditType(r.content_type);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditUrl('');
    setEditType('');
  };

  const saveEdit = (id: string) => {
    startTransition(async () => {
      try {
        const updates: any = {};
        const original = resources.find(r => r.id === id);
        if (!original) return;

        if (editTitle !== original.title) updates.title = editTitle;
        if (editUrl !== (original.source_url || '')) updates.source_url = editUrl;
        if (editType !== original.content_type) updates.content_type = editType;

        if (Object.keys(updates).length === 0) {
          cancelEdit();
          return;
        }

        const result = await updateResource(id, updates);
        if (result.success) {
          setResources(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
          showToast({ message: 'Resource updated!', type: 'success' });
          cancelEdit();
        } else {
          showToast({ message: result.error || 'Failed to update', type: 'error' });
        }
      } catch (err: any) {
        showToast({ message: 'Update failed: ' + (err.message || 'Unknown error'), type: 'error' });
      }
    });
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
            <option value="mathematics-4024">O-Level / IGCSE (4024/0580)</option>
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
              <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${editingId === r.id ? 'bg-gold-50/30' : ''}`}>
                <td className="px-4 py-3 font-medium text-navy-900 max-w-[200px]">
                  {editingId === r.id ? (
                    <div className="space-y-1.5">
                      <input 
                        value={editTitle} 
                        onChange={e => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gold-300 rounded-md focus:ring-1 focus:ring-gold-500 outline-none"
                      />
                      <input 
                        value={editUrl} 
                        onChange={e => setEditUrl(e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono border border-navy-200 rounded-md focus:ring-1 focus:ring-gold-500 outline-none"
                        placeholder="Source URL"
                      />
                    </div>
                  ) : (
                    <span className="truncate block" title={r.title}>{r.title}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-navy-500">
                  <div className="font-semibold">{r.subject.replace('mathematics-', '')}</div>
                  <div className="truncate w-32" title={r.category?.name || 'Uncategorized'}>{r.category?.name || 'Uncategorized'}</div>
                </td>
                <td className="px-4 py-3">
                  {editingId === r.id ? (
                    <select value={editType} onChange={e => setEditType(e.target.value)} className="px-2 py-1 text-xs border border-navy-200 rounded-md">
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="worksheet">Worksheet</option>
                    </select>
                  ) : (
                    <span className="bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full text-xs font-mono uppercase">
                      {r.content_type}
                    </span>
                  )}
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
                  <div className="flex items-center justify-end gap-2">
                    {editingId === r.id ? (
                      <>
                        <button 
                          onClick={() => saveEdit(r.id)}
                          disabled={isPending}
                          className="text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-50 transition-colors"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="text-navy-400 hover:text-navy-700 p-1 rounded hover:bg-navy-50 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEdit(r)}
                          className="text-navy-400 hover:text-gold-500 transition-colors p-1 rounded hover:bg-gold-50"
                          title="Edit Resource"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <a 
                          href={`/view/${r.id}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="text-navy-400 hover:text-gold-500 transition-colors p-1 rounded hover:bg-gold-50"
                          title="Preview"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleDelete(r.id, r.title)}
                          className="text-navy-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                          title="Delete Resource"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
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
        }} 
      />
    </div>
  );
}
