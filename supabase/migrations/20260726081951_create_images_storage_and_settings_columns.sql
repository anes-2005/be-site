/*
# Create images storage bucket + add image columns to site_settings

1. Purpose
   - Create a public Supabase Storage bucket `images` for uploaded admin images.
   - Add image URL columns to `site_settings` for logo, hero background, about page
     images, and open-graph image, so all site images are editable from the admin
     and stored in Supabase Storage (no more hardcoded public files or URL inputs).

2. Storage
   - Bucket `images` (public). Public read so the live site can render uploaded
     images without signed URLs. Writes are open to anon + authenticated for this
     single-tenant CMS (no public sign-in).

3. Table changes
   - `site_settings`
     - `logo_image` text (nullable) — brand logo shown in nav + footer
     - `hero_image` text (nullable) — home hero background image
     - `about_images` jsonb (array of strings) — images on the about page
     - `og_image` text (nullable) — default social share image

4. Security
   - Storage bucket is public-read; upload/insert/update/delete open to anon +
     authenticated (single-tenant CMS).
   - RLS already enabled on site_settings; existing policies cover the new columns.

5. Notes
   - Idempotent. New columns default to NULL / '[]' so existing rows stay valid.
*/

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (public read; open write for anon+authenticated single-tenant CMS)
DROP POLICY IF EXISTS "public_read_images" ON storage.objects;
CREATE POLICY "public_read_images"
ON storage.objects FOR SELECT
TO anon, authenticated USING (bucket_id = 'images');

DROP POLICY IF EXISTS "open_insert_images" ON storage.objects;
CREATE POLICY "open_insert_images"
ON storage.objects FOR INSERT
TO anon, authenticated WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "open_update_images" ON storage.objects;
CREATE POLICY "open_update_images"
ON storage.objects FOR UPDATE
TO anon, authenticated USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "open_delete_images" ON storage.objects;
CREATE POLICY "open_delete_images"
ON storage.objects FOR DELETE
TO anon, authenticated USING (bucket_id = 'images');

-- site_settings new columns
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS logo_image text,
  ADD COLUMN IF NOT EXISTS hero_image text,
  ADD COLUMN IF NOT EXISTS about_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS og_image text;
