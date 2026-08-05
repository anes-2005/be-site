/*
# Separate Home Hero image from Collection Cover image

1. Purpose
   The Home Hero (on the home page) and each Collection's cover image
   previously shared the same field (`collections.hero_image`): the home
   page fell back to the first collection's hero_image when no site-wide
   hero_image was set. This meant editing a collection's "Hero Image"
   could change the home page background, and vice versa.

   This migration introduces a dedicated `cover_image` column on
   `collections` for each collection's own cover, leaving
   `site_settings.hero_image` as the sole source for the Home Hero.

2. Table changes
   - `collections`
     - `cover_image` text (nullable) — this collection's own cover image,
       shown on the collection page, store cards, and admin previews.
       Independent of the home page hero.
   - `site_settings.hero_image` already exists and remains the sole
     source for the Home Hero background.

3. Data preservation
   - For every existing collection, copy the current `hero_image` value
     into the new `cover_image` column so no uploaded images are lost.
   - The original `hero_image` column is left untouched (kept for any
     historical references) but the application no longer uses it as a
     fallback for the home page.

4. Security
   - RLS is already enabled on `collections`; existing open CRUD
     policies (single-tenant CMS, no public sign-in) cover the new
     column automatically. No policy changes needed.

5. Notes
   - Idempotent: uses IF NOT EXISTS for the column addition and a
     conditional UPDATE that only backfills rows where cover_image
     is NULL.
*/

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS cover_image text;

-- Backfill: preserve existing uploaded images by copying hero_image
-- into cover_image for any row that has not yet been populated.
UPDATE collections
SET cover_image = hero_image
WHERE cover_image IS NULL;
