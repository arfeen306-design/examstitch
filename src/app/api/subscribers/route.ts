import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Simple email regex — good enough for a subscriber form
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, level = 'general', sourcePage = '/' } = body as {
      email: string;
      level?: string;
      sourcePage?: string;
    };

    // ── Validation ──────────────────────────────────────────────────────────
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // ── Persist to Supabase ─────────────────────────────────────────────────
    // Use the admin client so RLS doesn't block anonymous inserts.
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('subscribers')
      .insert({
        email: email.toLowerCase().trim(),
        level,
        source_page: sourcePage,
        is_active: true,
      });

    // Supabase returns error code 23505 for duplicate emails (unique constraint).
    // We treat this as a success — no need to tell the user we already have them.
    if (error && error.code !== '23505') {
      console.error('Subscriber insert error:', error);
      return NextResponse.json({ error: 'Could not save your email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error('Subscriber API error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// Return 405 for all other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
