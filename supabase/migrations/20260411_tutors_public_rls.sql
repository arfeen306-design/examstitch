-- Public read access for verified tutors (anon + authenticated clients using the anon key).
-- Service role (server actions / admin client) bypasses RLS.

alter table public.tutors enable row level security;

drop policy if exists "Public read verified tutors" on public.tutors;
create policy "Public read verified tutors"
  on public.tutors
  for select
  to anon, authenticated
  using (is_verified = true);
