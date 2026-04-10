-- Tutors catalog + sub-admin assignment mapping

create table if not exists public.tutors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  slug text not null unique,
  thumbnail_url text,
  hook_intro text,
  detailed_bio text,
  video_intro_url text,
  video_demo_url text,
  specialties text[] not null default '{}',
  locations text[] not null default '{}',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tutors_slug_idx on public.tutors(slug);
create index if not exists tutors_verified_idx on public.tutors(is_verified);

alter table public.student_accounts
  add column if not exists tutor_id uuid references public.tutors(id) on delete set null;

create index if not exists student_accounts_tutor_id_idx on public.student_accounts(tutor_id);

create or replace function public.set_tutors_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tutors_set_updated_at on public.tutors;
create trigger tutors_set_updated_at
before update on public.tutors
for each row
execute function public.set_tutors_updated_at();
