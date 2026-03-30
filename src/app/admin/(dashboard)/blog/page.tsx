import { createAdminClient } from '@/lib/supabase/admin';
import BlogEditorClient from './BlogEditorClient';

export default async function AdminBlogPage() {
  const supabase = createAdminClient();

  const { data: posts, error } = await supabase
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('AdminBlogPage:', error);
  }

  return <BlogEditorClient initialPosts={posts ?? []} />;
}
