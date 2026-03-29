import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Category {
  id: string;
  name: string;
  subject_id: string;
  subject: { name: string; code: string };
}

export default function NewResourceModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    subject: 'mathematics-4024',
    category_id: '',
    paper: '',
    year: new Date().getFullYear().toString(),
    source_url: '',
    content_type: 'pdf',
  });

  useEffect(() => {
    if (!isOpen) return;
    const fetchCategories = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase.from('categories').select('*, subject:subjects(name, code)');
      if (data) setCategories(data as any[]);
    };
    fetchCategories();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const urlRegex = /^https?:\/\/(drive\.google\.com|youtu\.be|www\.youtube\.com)\/.+/;
    if (!urlRegex.test(formData.source_url)) {
      showToast({ message: 'Must be a valid Google Drive or YouTube URL.', type: 'error' });
      setLoading(false);
      return;
    }

    if (!formData.category_id) {
      showToast({ message: 'Please select a Category/Topic.', type: 'error' });
      setLoading(false);
      return;
    }

    // Determine type heuristically if they selected auto, or use the drop down
    let sourceType = 'external_link';
    if (formData.source_url.includes('drive.google.com')) sourceType = 'google_drive';
    if (formData.source_url.includes('youtu')) sourceType = 'youtube';

    // Append year and paper to title automatically if provided
    const richTitle = `${formData.title} ${formData.year ? `(${formData.year})` : ''} ${formData.paper ? `Paper ${formData.paper}` : ''}`.trim();

    try {
      const { createResource } = await import('../../actions');
      const payload = {
        title: richTitle,
        subject: formData.subject,
        category_id: formData.category_id,
        source_url: formData.source_url,
        source_type: sourceType,
        content_type: formData.content_type,
        is_published: true,
        is_locked: false,
        is_watermarked: formData.content_type === 'worksheet',
      };

      const { success, error } = await createResource(payload);

      if (success) {
        showToast({ message: 'Resource created successfully!', type: 'success' });
        onSuccess();
        setFormData({ ...formData, title: '', source_url: '', paper: '' });
      } else {
        showToast({ message: error || 'Failed to create resource', type: 'error' });
      }
    } catch (err: any) {
      showToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter categories by selected subject code ('4024' or '9709')
  const subjectCode = formData.subject.split('-')[1];
  const activeCategories = categories.filter(c => c.subject?.code === subjectCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-navy-50 bg-navy-50/50">
          <h2 className="text-xl font-semibold text-navy-900">New Resource</h2>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-navy-700 mb-1">Internal Title / Name</label>
              <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500" placeholder="e.g. Differentiation Rules" />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Subject</label>
              <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value, category_id: '' })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500">
                <option value="mathematics-4024">O-Level (4024)</option>
                <option value="mathematics-9709">A-Level (9709)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Category / Topic</label>
              <select required value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500">
                <option value="" disabled>Select mapping...</option>
                {activeCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Paper # (Optional)</label>
              <input value={formData.paper} onChange={e => setFormData({ ...formData, paper: e.target.value })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500" placeholder="e.g. 1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Year (Optional)</label>
              <input value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500" placeholder="e.g. 2024" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-navy-700 mb-1">Content Type</label>
              <select value={formData.content_type} onChange={e => setFormData({ ...formData, content_type: e.target.value })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500">
                <option value="pdf">PDF Past Paper</option>
                <option value="video">Video Solution</option>
                <option value="worksheet">Topical Worksheet</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-navy-700 mb-1">Source URL (Drive/YouTube)</label>
              <input required value={formData.source_url} onChange={e => setFormData({ ...formData, source_url: e.target.value })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500 font-mono text-sm" placeholder="https://drive.google.com/..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-navy-50 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 rounded-lg transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-navy-900 rounded-lg hover:bg-navy-800 disabled:opacity-50 transition">
              {loading ? 'Saving...' : 'Save Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
