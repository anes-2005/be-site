/*
# Bilingual content support (Arabic + English)

1. Purpose
   Extend the CMS so every editable text field has both an English and an
   Arabic version. The frontend reads the Arabic columns when the visitor
   selects Arabic; otherwise it falls back to the English columns.

2. Modified Tables
   - `site_settings`
     - `brand_name_ar` text — Arabic brand name
     - `brand_tagline_ar` text — Arabic tagline
     - `hero_headline_ar` text — Arabic hero headline
     - `hero_subheadline_ar` text — Arabic hero subheadline
     - `hero_primary_cta_ar` text — Arabic primary button text
     - `hero_secondary_note_ar` text — Arabic secondary note
     - `about_title_ar` text — Arabic about page title
     - `about_cta_label_ar` text — Arabic about button label
     - `seo_title_ar` text — Arabic default SEO title
     - `seo_description_ar` text — Arabic default SEO description
     - `footer_note_ar` text — Arabic footer note
   - `collections`
     - `name_ar` text — Arabic collection name
     - `short_description_ar` text — Arabic short description
     - `long_description_ar` text — Arabic long description
     - `seo_title_ar` text — Arabic SEO title
     - `seo_description_ar` text — Arabic SEO description

3. Security
   - No RLS policy changes. The existing policies already cover the new
     columns because they are on the same tables.

4. Notes
   - All new columns are nullable and default to NULL so the frontend can
     fall back to the English value when no Arabic translation is set.
   - Idempotent: uses DO $$ ... IF NOT EXISTS ... END $$ blocks.
*/

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS brand_name_ar text;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS brand_tagline_ar text;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_headline_ar text;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_subheadline_ar text;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_primary_cta_ar text;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_secondary_note_ar text;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_title_ar text;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_cta_label_ar text;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_title_ar text;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_description_ar text;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_note_ar text;
END $$;

DO $$ BEGIN
  ALTER TABLE collections ADD COLUMN IF NOT EXISTS name_ar text;
  ALTER TABLE collections ADD COLUMN IF NOT EXISTS short_description_ar text;
  ALTER TABLE collections ADD COLUMN IF NOT EXISTS long_description_ar text;
  ALTER TABLE collections ADD COLUMN IF NOT EXISTS seo_title_ar text;
  ALTER TABLE collections ADD COLUMN IF NOT EXISTS seo_description_ar text;
END $$;
