import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// WhatsApp / phone validation — E.164 format: +[country][number], 8–15 digits total
const WHATSAPP_REGEX = /^\+[1-9]\d{7,14}$/;

// Generate a human-readable booking reference: EXST-XXXXX (base-36 timestamp suffix)
function generateBookingRef(): string {
  const suffix = Date.now().toString(36).toUpperCase().slice(-5);
  return `EXST-${suffix}`;
}

// Fire-and-forget push to Google Sheets via Apps Script webhook.
// Set GOOGLE_SHEETS_WEBHOOK_URL in your Vercel env vars.
//
// Google Apps Script to receive this (paste into script.google.com → New Project):
// ──────────────────────────────────────────────────────────────────────────────
// const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; // from the sheet URL
// function doPost(e) {
//   try {
//     const data = JSON.parse(e.postData.contents);
//     const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Bookings') ||
//                   SpreadsheetApp.openById(SHEET_ID).insertSheet('Bookings');
//     if (sheet.getLastRow() === 0) {
//       sheet.appendRow(['Booking ID', 'Timestamp', 'Name', 'WhatsApp', 'Level', 'Subject', 'Status']);
//     }
//     sheet.appendRow([data.booking_ref, data.created_at, data.name, data.whatsapp, data.level, data.subject, data.status]);
//     return ContentService.createTextOutput(JSON.stringify({ ok: true }))
//                          .setMimeType(ContentService.MimeType.JSON);
//   } catch(err) {
//     return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
//                          .setMimeType(ContentService.MimeType.JSON);
//   }
// }
// After pasting: Deploy → New Deployment → Web App → Execute as: Me → Access: Anyone → Deploy.
// Copy the /exec URL and set it as GOOGLE_SHEETS_WEBHOOK_URL in Vercel.
// ──────────────────────────────────────────────────────────────────────────────
async function syncToGoogleSheets(payload: Record<string, string>) {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return; // silently skip if not configured

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Non-fatal — log but don't fail the booking
    console.error('[demo-bookings] Google Sheets sync failed:', err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name?: string;
      whatsapp?: string;
      level?: string;
      subject?: string;
    };

    const { name, whatsapp, level, subject } = body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }
    if (!whatsapp || !WHATSAPP_REGEX.test(whatsapp.trim())) {
      return NextResponse.json(
        { error: 'Enter a valid WhatsApp number in international format, e.g. +923001234567.' },
        { status: 400 },
      );
    }
    if (!level || level.trim().length === 0) {
      return NextResponse.json({ error: 'Please select your grade / level.' }, { status: 400 });
    }
    if (!subject || subject.trim().length === 0) {
      return NextResponse.json({ error: 'Please select a subject.' }, { status: 400 });
    }

    const booking_ref = generateBookingRef();
    const status = 'pending' as const;

    // ── Persist to Supabase ─────────────────────────────────────────────────
    const supabase = createAdminClient();

    const { data: inserted, error } = await supabase
      .from('demo_bookings')
      .insert({ booking_ref, name: name.trim(), whatsapp: whatsapp.trim(), level, subject, status })
      .select('*')
      .single();

    if (error) {
      console.error('[demo-bookings] Supabase insert error:', error);
      return NextResponse.json({ error: 'Could not save your booking. Please try again.' }, { status: 500 });
    }

    // ── Sync to Google Sheets (fire-and-forget) ─────────────────────────────
    syncToGoogleSheets({
      booking_ref,
      created_at: inserted.created_at,
      name: inserted.name,
      whatsapp: inserted.whatsapp,
      level: inserted.level,
      subject: inserted.subject,
      status: inserted.status,
    });

    return NextResponse.json({ success: true, booking_ref }, { status: 200 });

  } catch (err) {
    console.error('[demo-bookings] API error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
