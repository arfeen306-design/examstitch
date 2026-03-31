import { createAdminClient } from '@/lib/supabase/admin';
import type { DemoBooking } from '@/lib/supabase/types';
import BookingsClient from './BookingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  const supabase = createAdminClient();

  const { data: bookings, error } = await supabase
    .from('demo_bookings')
    .select('*')
    .order('created_at', { ascending: false });

  const rows = (bookings as DemoBooking[] | null) ?? [];

  return <BookingsClient rows={rows} error={error?.message} />;
}
