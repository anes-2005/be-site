/*
# Create site_settings table

1. Purpose
   A single-row CMS settings table that controls every piece of site-wide
   content: brand name, hero copy, "Why Preorder" cards, about page, SEO
   defaults, navigation, and a site-wide publish toggle. Editing these values
   in the admin updates the public site immediately — no code changes needed.

2. New Tables
   - `site_settings`
     - `id` int PK (always 1 — singleton)
     - `site_online` bool — master publish toggle
     - `brand_name` text
     - `brand_tagline` text
     - `instagram_url` text
     - `hero_headline` text
     - `hero_subheadline` text
     - `hero_primary_cta` text
     - `hero_secondary_note` text
     - `why_preorder` jsonb — array of {title, body}
     - `about_title` text
     - `about_paragraphs` jsonb — array of strings
     - `about_cta_label` text
     - `seo_title` text
     - `seo_description` text
     - `nav_links` jsonb — array of {label, to}
     - `footer_note` text
     - `updated_at` timestamptz

3. Security
   - RLS enabled. Full CRUD open to anon + authenticated (single-tenant CMS,
     no public sign-in). Intentional for a lightweight admin.

4. Notes
   - Idempotent. Seeds the singleton row with current defaults.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  site_online boolean NOT NULL DEFAULT true,
  brand_name text NOT NULL DEFAULT 'be',
  brand_tagline text NOT NULL DEFAULT 'Be Different',
  instagram_url text NOT NULL DEFAULT 'https://www.instagram.com/beva.tht?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  hero_headline text NOT NULL DEFAULT 'BE DIFFERENT',
  hero_subheadline text NOT NULL DEFAULT 'Limited preorder. Only 100 pieces will ever be available.',
  hero_primary_cta text NOT NULL DEFAULT 'Preorder Now',
  hero_secondary_note text NOT NULL DEFAULT 'Estimated shipping after production.',
  why_preorder jsonb NOT NULL DEFAULT '[]'::jsonb,
  about_title text NOT NULL DEFAULT 'Made to be different.',
  about_paragraphs jsonb NOT NULL DEFAULT '[]'::jsonb,
  about_cta_label text NOT NULL DEFAULT 'Instagram',
  seo_title text NOT NULL DEFAULT 'be — Limited Preorder',
  seo_description text NOT NULL DEFAULT 'be. A limited preorder collection. Only 100 pieces will ever be available.',
  nav_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  footer_note text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_site_settings" ON site_settings;
CREATE POLICY "read_site_settings"
ON site_settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_site_settings" ON site_settings;
CREATE POLICY "insert_site_settings"
ON site_settings FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_site_settings" ON site_settings;
CREATE POLICY "update_site_settings"
ON site_settings FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_site_settings" ON site_settings;
CREATE POLICY "delete_site_settings"
ON site_settings FOR DELETE
TO anon, authenticated USING (true);

-- Seed singleton with current defaults.
INSERT INTO site_settings (id, why_preorder, about_paragraphs, nav_links, footer_note)
VALUES (
  1,
  '[{"title":"Limited Collection","body":"A fixed run of 100 pieces. Once they are reserved, no more will be made."},{"title":"Premium Materials","body":"Selected fabrics and finishes, cut and assembled to a luxury standard."},{"title":"Made Only For Those Who Reserve","body":"Each piece is produced to order for the person who claimed it — nothing surplus."}]'::jsonb,
  '["be is a clothing brand built on restraint. We make limited runs, produced only for those who reserve them.","No surplus. No compromise. Each piece is cut from premium materials and assembled to a luxury standard. Preordering is not a wait — it is the point. It is how we ensure nothing is made that does not need to exist.","We begin with one collection. Over time, the store will grow — but the principle will not change."]'::jsonb,
  '[{"label":"Home","to":"/"},{"label":"Store","to":"/store"},{"label":"About","to":"/about"}]'::jsonb,
  'All rights reserved.'
)
ON CONFLICT (id) DO NOTHING;
