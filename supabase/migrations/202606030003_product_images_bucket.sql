-- ONE TWO — Product image storage
-- Creates the public bucket used by /api/upload and /api/ai/enhance-photo.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  20971520,
  array['image/webp', 'image/jpeg', 'image/png', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product images public read'
  ) then
    create policy "product images public read"
      on storage.objects for select
      using (bucket_id = 'product-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product images authenticated insert'
  ) then
    create policy "product images authenticated insert"
      on storage.objects for insert
      with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product images authenticated update'
  ) then
    create policy "product images authenticated update"
      on storage.objects for update
      using (bucket_id = 'product-images' and auth.role() = 'authenticated')
      with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product images authenticated delete'
  ) then
    create policy "product images authenticated delete"
      on storage.objects for delete
      using (bucket_id = 'product-images' and auth.role() = 'authenticated');
  end if;
end $$;
