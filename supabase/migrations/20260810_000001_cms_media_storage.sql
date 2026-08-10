-- Public CMS media buckets for admin-uploaded vehicle and team images.
-- Public read; writes go through the website service role (admin API).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'cms-vehicle-media',
    'cms-vehicle-media',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'cms-team-photos',
    'cms-team-photos',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for both buckets
drop policy if exists "Public read cms-vehicle-media" on storage.objects;
create policy "Public read cms-vehicle-media"
  on storage.objects for select
  to public
  using (bucket_id = 'cms-vehicle-media');

drop policy if exists "Public read cms-team-photos" on storage.objects;
create policy "Public read cms-team-photos"
  on storage.objects for select
  to public
  using (bucket_id = 'cms-team-photos');

-- Service role bypasses RLS; no anon/authenticated insert policies (admin API only).
