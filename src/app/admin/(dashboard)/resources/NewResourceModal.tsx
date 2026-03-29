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
    video_url: '',
    worksheet_url: '',
    solution_url: '',
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

    if (!formData.category_id) {
      showToast({ message: 'Please select a Category/Topic.', type: 'error' });
      setLoading(false);
      return;
    }

    if (!formData.video_url && !formData.worksheet_url && !formData.solution_url) {
      showToast({ message: 'Please provide at least one resource URL.', type: 'error' });
      setLoading(false);
      return;
    }

    const validateUrl = (url: string) => {
      if (!url) return true; // empty allows it to pass safely
      return /^https?:\/\/(drive\.google\.com|youtu\.be|www\.youtube\.com)\/.+/.test(url);
    };

    if (!validateUrl(formData.video_url) || !validateUrl(formData.worksheet_url) || !validateUrl(formData.solution_url)) {
       showToast({ message: 'Source URLs must be valid YouTube or Google Drive links.', type: 'error' });
       setLoading(false);
       return;
    }

    const richTitle = `${formData.title} ${formData.year ? `(${formData.year})` : ''} ${formData.paper ? `Paper ${formData.paper}` : ''}`.trim();
    
    // Build array of up to 3 payloads
    const payloads = [];
    
    if (formData.video_url) {
      payloads.push({
        title: richTitle,
        subject: formData.subject,
        category_id: formData.category_id,
        source_url: formData.video_url,
        source_type: formData.video_url.includes('youtu') ? 'youtube' : 'google_drive',
        content_type: 'video',
        is_published: true,
        is_locked: false,
        is_watermarked: false,
      });
    }

    if (formData.worksheet_url) {
      payloads.push({
        title: richTitle,
        subject: formData.subject,
        category_id: formData.category_id,
        source_url: formData.worksheet_url,
        source_type: 'google_drive',
        content_type: 'worksheet',
        is_published: true,
        is_locked: false,
        is_watermarked: true,
      });
    }

    if (formData.solution_url) {
      payloads.push({
        title: richTitle + ' (Solution)',
        subject: formData.subject,
        category_id: formData.category_id,
        source_url: formData.solution_url,
        source_type: 'google_drive',
        content_type: 'pdf',
        is_published: true,
        is_locked: false,
        is_watermarked: false,
      });
    }

    try {
      const { bulkInsertResources } = await import('../../actions');
      const { success, error } = await bulkInsertResources(payloads);

      if (success) {
        showToast({ message: `Successfully linked ${payloads.length} resource(s)!`, type: 'success' });
        onSuccess();
        setFormData({ ...formData, title: '', video_url: '', worksheet_url: '', solution_url: '', paper: '' });
      } else {
        showToast({ message: error || 'Failed to link resources', type: 'error' });
      }
    } catch (err: any) {
      showToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const subjectCode = formData.subject.split('-')[1];
  const activeCategories = categories.filter(c => c.subject?.code === subjectCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between p-6 border-b border-navy-50 bg-navy-50/50 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-navy-900">Link Teaching Materials</h2>
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
                <option value="mathematics-4024">O-Level / IGCSE (4024/0580)</option>
                <option value="mathematics-9709">A-Level (9709)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Target Module</label>
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

            <div className="col-span-2 pt-2 border-t border-navy-50">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-400 mb-3">Resource Links (Paste at least 1)</label>
              
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-red-500 w-16">Video</span>
                  <input value={formData.video_url} onChange={e => setFormData({ ...formData, video_url: e.target.value })} className="w-full pl-16 pr-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500 font-mono text-sm" placeholder="https://youtu.be/..." />
                </div>
                
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-green-500 w-16">Worksheet</span>
                  <input value={formData.worksheet_url} onChange={e => setFormData({ ...formData, worksheet_url: e.target.value })} className="w-full pl-20 pr-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500 font-mono text-sm" placeholder="https://drive.google.com/..." />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-blue-500 w-16">Solution</span>
                  <input value={formData.solution_url} onChange={e => setFormData({ ...formData, solution_url: e.target.value })} className="w-full pl-20 pr-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500 font-mono text-sm" placeholder="https://drive.google.com/..." />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-navy-50 mt-6 sticky bottom-0 bg-white">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 rounded-lg transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-navy-900 rounded-lg hover:bg-navy-800 disabled:opacity-50 transition">
              {loading ? 'Processing...' : 'Link Resources'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
