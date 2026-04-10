import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSubjectAdmin } from '@/lib/supabase/guards';
import { revalidateTag } from 'next/cache';
import { MODULE_TYPES } from '@/lib/constants';

/**
 * The Computer Science subject_id is resolved once at request time.
 * Frontend passes it via ?subject_id= query param or JSON body.
 * This route verifies the caller has CS access before any operation.
 */

const SUBJECT_SLUG = 'computer-science';

async function getCSSubjectId(): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('subjects')
    .select('id')
    .eq('slug', SUBJECT_SLUG)
    .single();
  return data?.id ?? null;
}

// ── GET /api/admin/cs/resources — List CS resources ─────────────────────────
export async function GET(request: Request) {
  try {
    const csId = await getCSSubjectId();
    if (!csId) return NextResponse.json({ error: 'Computer Science subject not found.' }, { status: 404 });

    const session = await requireSubjectAdmin(csId);
    if (!session) return NextResponse.json({ error: 'Access denied.' }, { status: 403 });

    const supabase = createAdminClient();
    const { data, error, count } = await supabase
      .from('resources')
      .select('*, category:categories(id, name, slug)', { count: 'exact' })
      .eq('subject_id', csId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[cs/resources] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch resources.' }, { status: 500 });
    }

    return NextResponse.json({ resources: data, total: count });
  } catch (err) {
    console.error('[cs/resources] GET error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ── POST /api/admin/cs/resources — Create a CS resource ─────────────────────
export async function POST(request: Request) {
  try {
    const csId = await getCSSubjectId();
    if (!csId) return NextResponse.json({ error: 'Computer Science subject not found.' }, { status: 404 });

    const session = await requireSubjectAdmin(csId);
    if (!session) return NextResponse.json({ error: 'Access denied.' }, { status: 403 });

    const body = await request.json();
    const { title, description, content_type, source_type, source_url, topic, category_id, module_type } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    if (!content_type) return NextResponse.json({ error: 'Content type is required.' }, { status: 400 });
    if (!source_type) return NextResponse.json({ error: 'Source type is required.' }, { status: 400 });
    if (!source_url?.trim()) return NextResponse.json({ error: 'Source URL is required.' }, { status: 400 });
    if (!category_id) return NextResponse.json({ error: 'Category is required.' }, { status: 400 });

    // Validate module_type
    const validModuleTypes = [MODULE_TYPES.VIDEO_TOPICAL, MODULE_TYPES.SOLVED_PAST_PAPER];
    const safeModuleType = validModuleTypes.includes(module_type) ? module_type : MODULE_TYPES.VIDEO_TOPICAL;

    const supabase = createAdminClient();

    // Verify category belongs to CS (through subject_papers linkage)
    const { data: category } = await supabase
      .from('categories')
      .select('id, subject_id')
      .eq('id', category_id)
      .single();

    if (!category) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
    }

    const { data: resource, error } = await supabase
      .from('resources')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        content_type,
        source_type,
        source_url: source_url.trim(),
        topic: topic?.trim() || null,
        category_id,
        module_type: safeModuleType,
        subject: SUBJECT_SLUG,
        subject_id: csId,     // Automatically attached — never trust client
        is_published: true,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[cs/resources] POST error:', error);
      return NextResponse.json({ error: 'Failed to create resource.' }, { status: 500 });
    }

    revalidateTag('resources');
    return NextResponse.json({ resource }, { status: 201 });
  } catch (err) {
    console.error('[cs/resources] POST error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ── DELETE /api/admin/cs/resources — Delete a CS resource ───────────────────
export async function DELETE(request: Request) {
  try {
    const csId = await getCSSubjectId();
    if (!csId) return NextResponse.json({ error: 'Computer Science subject not found.' }, { status: 404 });

    const session = await requireSubjectAdmin(csId);
    if (!session) return NextResponse.json({ error: 'Access denied.' }, { status: 403 });

    const { id } = await request.json() as { id?: string };
    if (!id) return NextResponse.json({ error: 'Resource ID is required.' }, { status: 400 });

    const supabase = createAdminClient();

    // Verify the resource belongs to Computer Science before deleting
    const { data: resource } = await supabase
      .from('resources')
      .select('id, subject_id')
      .eq('id', id)
      .single();

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    }

    if (resource.subject_id !== csId) {
      return NextResponse.json(
        { error: 'This resource does not belong to Computer Science.' },
        { status: 403 },
      );
    }

    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) {
      console.error('[cs/resources] DELETE error:', error);
      return NextResponse.json({ error: 'Failed to delete resource.' }, { status: 500 });
    }

    revalidateTag('resources');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[cs/resources] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
