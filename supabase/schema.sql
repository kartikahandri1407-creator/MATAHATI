-- MATA HATI: skema database (Supabase / Postgres)
-- Jalankan sekali di Supabase: SQL Editor > New query > tempel > Run.

create table if not exists public.mh_records (
  collection text        not null check (collection in ('facilities','claims','cases','meta')),
  id         text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

-- Keamanan: RLS aktif TANPA policy = browser (kunci anon) tidak bisa membaca/menulis apa pun.
-- Hanya server (service role key, di Vercel/AI Studio) yang boleh mengakses tabel ini.
alter table public.mh_records enable row level security;
