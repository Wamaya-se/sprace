-- ============================================================
-- Sprace — Fas 6c: Storage policy hardening + MIME types
-- ============================================================

-- 1. Tighten INSERT policy to scope uploads to user's own folder
drop policy if exists "Authenticated users can upload media" on storage.objects;

create policy "Users can upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Add MIME types needed for deliveries (PDF, ZIP, QuickTime)
update storage.buckets
  set allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf', 'application/zip'
  ]
  where id = 'media';
