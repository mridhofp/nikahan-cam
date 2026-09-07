-- Jalankan di SQL Editor Supabase sebelum buka webapp.

create table if not exists public.guest_photos (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null,
  guest_name text not null,
  photo_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists guest_photos_guest_id_idx
  on public.guest_photos (guest_id);

create index if not exists guest_photos_created_at_idx
  on public.guest_photos (created_at desc);

alter table public.guest_photos enable row level security;

drop policy if exists "Anyone can view photos" on public.guest_photos;
create policy "Anyone can view photos"
  on public.guest_photos for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can insert photos" on public.guest_photos;
create policy "Anyone can insert photos"
  on public.guest_photos for insert
  to anon, authenticated
  with check (true);

insert into storage.buckets (id, name, public)
values ('guest-photos', 'guest-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read guest photos" on storage.objects;
create policy "Public read guest photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'guest-photos');

drop policy if exists "Public upload guest photos" on storage.objects;
create policy "Public upload guest photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'guest-photos');
