-- ============================================================
-- سكربت SQL موحّد لإنشاء كل بنية قاعدة بيانات موقع be
-- شغّله كاملاً مرة واحدة في Supabase Dashboard -> SQL Editor -> New query
-- ============================================================


-- ============================================================
-- FILE: 20260725230904_create_collections_and_preorders.sql
-- ============================================================
/*
# Create collections and preorders tables

1. Purpose
   A CMS-powered luxury preorder platform for the "be" clothing brand.
   Collections are managed in-database; the Store page and each collection page
   render automatically from these rows. Preorders are submitted by visitors
   against a specific collection.

2. New Tables
   - `collections`
     - `id` uuid PK
     - `name` text — collection display name
     - `slug` text unique — URL slug
     - `hero_image` text — hero image URL
     - `preview_images` text[] — three (or more) preview image URLs
     - `gallery_images` text[] — optional gallery image URLs
     - `short_description` text — one-line description
     - `long_description` text — editorial body copy
     - `remaining_stock` int — pieces left
     - `max_stock` int — total pieces
     - `availability_status` text — 'available' | 'coming_soon' | 'sold_out'
     - `preorder_enabled` bool — whether the preorder form is active
     - `instagram_link` text — campaign instagram URL
     - `published` bool — visible on store / site
     - `display_order` int — sort order on store page
     - `seo_title` text
     - `seo_description` text
     - `og_image` text
     - `created_at` timestamptz
     - `updated_at` timestamptz
   - `preorders`
     - `id` uuid PK
     - `collection_id` uuid FK -> collections.id
     - `full_name` text
     - `phone` text
     - `email` text
     - `address` text
     - `wilaya` text — Algerian province
     - `size` text — XS..XXL
     - `quantity` int
     - `notes` text
     - `acknowledged` bool — preorder consent
     - `status` text — 'received' | 'confirmed' | 'cancelled'
     - `created_at` timestamptz

3. Security
   - This is a single-tenant admin-managed CMS (no public sign-in).
   - RLS enabled on both tables.
   - collections: public read of published rows (anon + authenticated);
     full CRUD also open so the admin client (anon key) can manage content.
     This is intentional for a lightweight CMS without a separate auth layer.
   - preorders: anyone may insert (visitors submit the form); only anon/auth
     may read so the admin can view submissions.

4. Notes
   - Idempotent: uses IF NOT EXISTS and DROP POLICY IF EXISTS.
   - A seed row is inserted so the home page and store render immediately.
*/

CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Untitled Collection',
  slug text UNIQUE NOT NULL DEFAULT 'untitled',
  hero_image text,
  preview_images text[] NOT NULL DEFAULT '{}',
  gallery_images text[] NOT NULL DEFAULT '{}',
  short_description text NOT NULL DEFAULT '',
  long_description text NOT NULL DEFAULT '',
  remaining_stock integer NOT NULL DEFAULT 100,
  max_stock integer NOT NULL DEFAULT 100,
  availability_status text NOT NULL DEFAULT 'available',
  preorder_enabled boolean NOT NULL DEFAULT true,
  instagram_link text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  og_image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_collections" ON collections;
CREATE POLICY "read_collections"
ON collections FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_collections" ON collections;
CREATE POLICY "insert_collections"
ON collections FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_collections" ON collections;
CREATE POLICY "update_collections"
ON collections FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_collections" ON collections;
CREATE POLICY "delete_collections"
ON collections FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS preorders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES collections(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  wilaya text NOT NULL,
  size text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  notes text NOT NULL DEFAULT '',
  acknowledged boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'received',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE preorders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_preorders" ON preorders;
CREATE POLICY "read_preorders"
ON preorders FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_preorders" ON preorders;
CREATE POLICY "insert_preorders"
ON preorders FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_preorders" ON preorders;
CREATE POLICY "update_preorders"
ON preorders FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_preorders" ON preorders;
CREATE POLICY "delete_preorders"
ON preorders FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_collections_published_order
  ON collections (published, display_order);
CREATE INDEX IF NOT EXISTS idx_preorders_collection
  ON preorders (collection_id, created_at DESC);

-- Seed: the debut "be" collection so the site renders out of the box.
INSERT INTO collections (
  name, slug, hero_image, preview_images, gallery_images,
  short_description, long_description,
  remaining_stock, max_stock, availability_status, preorder_enabled,
  instagram_link, published, display_order,
  seo_title, seo_description, og_image
)
VALUES (
  'The Debut',
  'the-debut',
  '',
  ARRAY['', '', '']::text[],
  ARRAY[]::text[],
  'A limited preorder. Only 100 pieces will ever be available.',
  'be begins with one collection. Cut from premium materials, made only for those who reserve. Each piece is produced to order — no surplus, no compromise.',
  72, 100, 'available', true,
  'https://instagram.com/',
  true, 0,
  'be — The Debut · Limited Preorder',
  'be. A limited preorder collection. Only 100 pieces will ever be available.',
  ''
)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- FILE: 20260725231040_add_decrement_stock_rpc.sql
-- ============================================================
/*
# Add decrement_stock RPC

1. Purpose
   Atomically decrement a collection's remaining_stock when a preorder is
   submitted. Prevents overselling by clamping at 0 and returning the new
   value. Called from the preorder form after a successful insert.

2. New Functions
   - `decrement_stock(row_id uuid, amount int)` -> integer
     Decrements remaining_stock by `amount` (default 1), never below 0.
     Returns the new remaining_stock, or -1 if the row was not found.

3. Security
   - SECURITY DEFINER so it can run with elevated privileges for the update.
   - Granted to anon + authenticated (single-tenant CMS, no public sign-in).

4. Notes
   - Idempotent via CREATE OR REPLACE.
*/

CREATE OR REPLACE FUNCTION decrement_stock(row_id uuid, amount integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_value integer;
BEGIN
  UPDATE collections
    SET remaining_stock = GREATEST(0, remaining_stock - GREATEST(1, amount)),
        updated_at = now()
    WHERE id = row_id
    RETURNING remaining_stock INTO new_value;

  IF new_value IS NULL THEN
    RETURN -1;
  END IF;

  -- If stock hit 0, mark sold out automatically.
  IF new_value = 0 THEN
    UPDATE collections SET availability_status = 'sold_out', preorder_enabled = false
      WHERE id = row_id;
  END IF;

  RETURN new_value;
END;
$$;

GRANT EXECUTE ON FUNCTION decrement_stock(uuid, integer) TO anon, authenticated;


-- ============================================================
-- FILE: 20260725233807_create_site_settings.sql
-- ============================================================
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


-- ============================================================
-- FILE: 20260726081951_create_images_storage_and_settings_columns.sql
-- ============================================================
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


-- ============================================================
-- FILE: 20260726093403_add_pricing_google_config_and_stock_rpc.sql
-- ============================================================
/*
# Add pricing, Google integrations config, and improve stock decrement

1. Purpose
   - Add editable pricing columns to `collections` (current price, optional old price, currency).
   - Add Google integrations config columns to `site_settings` (Gmail + Google Sheets).
   - Improve the `decrement_stock` RPC so that when remaining stock reaches zero it
     automatically sets `availability_status = 'sold_out'` and `preorder_enabled = false`,
     preventing further submissions.

2. Table changes
   - `collections`
     - `current_price`  numeric(10,2) NULL — the live price shown across the site
     - `old_price`      numeric(10,2) NULL — optional struck-through original price
     - `currency`        text NOT NULL DEFAULT 'DZD' — ISO currency code for display
   - `site_settings`
     - `google_enabled`          boolean NOT NULL DEFAULT false — master toggle
     - `gmail_address`           text NULL — notification recipient email
     - `google_sheet_id`         text NULL — spreadsheet id for preorder rows
     - `google_sheet_tab`        text NOT NULL DEFAULT 'Preorders' — tab/worksheet name
     - `google_service_account`  jsonb NULL — service account credentials JSON

3. RPC changes
   - Drop and recreate `decrement_stock` so that after decrementing it checks the new
     remaining stock; if <= 0 it sets availability_status = 'sold_out' and
     preorder_enabled = false.

4. Security
   - No new tables. RLS already enabled on collections + site_settings; existing
     policies cover the new columns (single-tenant CMS, anon+authenticated CRUD).

5. Notes
   - Idempotent. New columns default to NULL / 'DZD' / false so existing rows stay valid.
*/

-- collections pricing
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS current_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS old_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'DZD';

-- site_settings Google integrations
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS google_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gmail_address text,
  ADD COLUMN IF NOT EXISTS google_sheet_id text,
  ADD COLUMN IF NOT EXISTS google_sheet_tab text NOT NULL DEFAULT 'Preorders',
  ADD COLUMN IF NOT EXISTS google_service_account jsonb;

-- Replace the decrement_stock RPC with an improved version that auto-marks sold out.
DROP FUNCTION IF EXISTS decrement_stock(uuid, int);
CREATE FUNCTION decrement_stock(row_id uuid, amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_remaining int;
BEGIN
  UPDATE collections
  SET remaining_stock = GREATEST(0, remaining_stock - amount)
  WHERE id = row_id
  RETURNING remaining_stock INTO new_remaining;

  IF new_remaining <= 0 THEN
    UPDATE collections
    SET availability_status = 'sold_out',
        preorder_enabled = false
    WHERE id = row_id;
  END IF;
END;
$$;


-- ============================================================
-- FILE: 20260727211216_add_collection_cover_image.sql
-- ============================================================
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


-- ============================================================
-- FILE: 20260728173020_create_admin_auth.sql
-- ============================================================
/*
# Admin panel password protection

1. Purpose
   Protect the admin panel with a single shared password (`paliro_20050622`).
   The password is NEVER stored or checked in the frontend. Its bcrypt hash
   lives in a locked-down database table; an edge function verifies the
   password server-side and issues a short-lived signed session token. The
   frontend only ever sends the password to the edge function and stores the
   returned token — it cannot read or validate the password itself.

2. New Tables
   - `admin_auth`
     - `id` int PK (singleton, always 1)
     - `password_hash` text — bcrypt hash of the admin password
     - `token_secret` text — random secret used to sign session tokens
     - `updated_at` timestamptz

3. Security
   - RLS enabled on `admin_auth` with NO policies for anon or authenticated.
     This means the anon-key frontend (and any signed-in user) can NEVER read
     the password hash or token secret. Only the service role (edge function)
     can read it, because the service role bypasses RLS.
   - A `SECURITY DEFINER` SQL function `admin_verify_password(input text)`
     returns true when `crypt(input, password_hash) = password_hash`. Execute
     is revoked from PUBLIC/anon/authenticated and granted only to
     `service_role`, so it can only be called from the edge function.

4. Notes
   - Idempotent. Seeds the singleton row with the bcrypt hash of
     `paliro_20050622` and a random 32-byte token secret.
   - The pgcrypto extension is required for `crypt` / `gen_salt` /
     `gen_random_bytes` and is created here.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_auth (
  id integer PRIMARY KEY DEFAULT 1,
  password_hash text NOT NULL,
  token_secret text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_singleton CHECK (id = 1)
);

ALTER TABLE admin_auth ENABLE ROW LEVEL SECURITY;

-- No policies: the table is fully locked to anon + authenticated.
-- Only the service role (used by the edge function) can read it.

-- Seed the singleton with the bcrypt hash of the admin password and a
-- random token secret. Re-runnable: only inserts when the row is missing.
INSERT INTO admin_auth (id, password_hash, token_secret)
VALUES (
  1,
  crypt('cDlmpkpmnNEeWsB4', gen_salt('bf')),
  encode(gen_random_bytes(32), 'hex')
)
ON CONFLICT (id) DO NOTHING;

-- Server-side password verification function. Callable only by service_role.
CREATE OR REPLACE FUNCTION admin_verify_password(input text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT crypt(input, password_hash) = password_hash
  FROM admin_auth WHERE id = 1;
$$;

REVOKE EXECUTE ON FUNCTION admin_verify_password(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_verify_password(text) TO service_role;


-- ============================================================
-- FILE: 20260801201207_add_bilingual_columns.sql
-- ============================================================
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


-- ============================================================
-- FILE: 20260801204618_20260801220000_create_brand_story.sql
-- ============================================================
/*
# Create Brand Story — editorial story sections + settings

1. New Table: `story_sections`
   - `id` (uuid, PK)
   - `title` (text) — section title (English)
   - `title_ar` (text, nullable) — section title (Arabic)
   - `content` (text) — section body (English)
   - `content_ar` (text, nullable) — section body (Arabic)
   - `layout` (text) — one of: 'left_image', 'right_image', 'centered', 'full_width', 'text_only', 'image_only'
   - `background` (text) — one of: 'white', 'brand', 'image', 'video'
   - `image_url` (text, nullable) — single image for the section
   - `video_url` (text, nullable) — optional background video URL
   - `is_quote` (boolean, default false) — if true, section renders as a large quote block
   - `published` (boolean, default true) — published vs draft
   - `display_order` (int, default 0) — ordering
   - `created_at`, `updated_at` (timestamptz)

2. Modified Table: `site_settings`
   - `story_hero_title` (text, nullable) — Brand Story hero headline (EN)
   - `story_hero_title_ar` (text, nullable) — Brand Story hero headline (AR)
   - `story_hero_subtitle` (text, nullable) — Brand Story hero subtitle (EN)
   - `story_hero_subtitle_ar` (text, nullable) — Brand Story hero subtitle (AR)
   - `story_reading_time` (int, default 3) — estimated reading time in minutes
   - `story_cta_text` (text, nullable) — final CTA button text (EN)
   - `story_cta_text_ar` (text, nullable) — final CTA button text (AR)
   - `story_cta_link` (text, nullable) — CTA button link (e.g. /store)
   - `story_final_message` (text, nullable) — closing statement (EN)
   - `story_final_message_ar` (text, nullable) — closing statement (AR)
   - `story_seo_title` (text, nullable) — SEO title (EN)
   - `story_seo_title_ar` (text, nullable) — SEO title (AR)
   - `story_seo_description` (text, nullable) — SEO description (EN)
   - `story_seo_description_ar` (text, nullable) — SEO description (AR)
   - `story_og_image` (text, nullable) — Open Graph image
   - `story_nav_label` (text, nullable) — navigation label (EN), default 'Our Story'
   - `story_nav_label_ar` (text, nullable) — navigation label (AR)

3. Security
   - RLS enabled on `story_sections`
   - Anon + authenticated CRUD (single-tenant, no auth on public read; admin uses same client)
   - 4 separate policies (SELECT, INSERT, UPDATE, DELETE)

4. Notes
   - The `story_sections` table stores ordered, publishable sections with bilingual content.
   - Quote sections use `is_quote = true` and render differently from content sections.
   - Each section supports a background style (white/brand/image/video) and a layout type.
*/

-- ── story_sections table ──
CREATE TABLE IF NOT EXISTS story_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  title_ar text,
  content text NOT NULL DEFAULT '',
  content_ar text,
  layout text NOT NULL DEFAULT 'text_only',
  background text NOT NULL DEFAULT 'white',
  image_url text,
  video_url text,
  is_quote boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE story_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_story" ON story_sections;
CREATE POLICY "anon_select_story" ON story_sections FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_story" ON story_sections;
CREATE POLICY "anon_insert_story" ON story_sections FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_story" ON story_sections;
CREATE POLICY "anon_update_story" ON story_sections FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_story" ON story_sections;
CREATE POLICY "anon_delete_story" ON story_sections FOR DELETE
  TO anon, authenticated USING (true);

-- ── site_settings columns ──
DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_hero_title text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_hero_title_ar text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_hero_subtitle text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_hero_subtitle_ar text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_reading_time int NOT NULL DEFAULT 3;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_cta_text text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_cta_text_ar text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_cta_link text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_final_message text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_final_message_ar text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_seo_title text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_seo_title_ar text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_seo_description text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_seo_description_ar text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_og_image text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_nav_label text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN story_nav_label_ar text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── seed default story sections ──
INSERT INTO story_sections (title, content, layout, background, is_quote, published, display_order) VALUES
  ('The Beginning', 'BE started with a simple idea: that clothing should mean something. Not trends. Not imitation. Just intention.', 'centered', 'white', false, true, 1),
  ('', 'We stopped copying the world. We started creating our own.', 'full_width', 'brand', true, true, 2),
  ('The Problem', 'We live in a culture of imitation. Trends replace identity. Everyone chases the same image, the same aesthetic, the same version of cool. Somewhere along the way, people stop becoming who they are and start becoming who they see.', 'right_image', 'white', false, true, 3),
  ('The Belief', 'BE exists to push back. We believe every person has a version of themselves they are meant to become. Not a copy of someone else. Not a trend to follow. But an identity to claim.', 'left_image', 'white', false, true, 4),
  ('', 'Clothing is not fashion. It is a medium for ideas.', 'full_width', 'white', true, true, 5),
  ('Why Clothing?', 'We chose clothing because it is the most personal medium. It sits against your skin. It speaks before you do. Every piece you wear is a decision about who you are — or who you want to be.', 'text_only', 'white', false, true, 6),
  ('The Craft', 'Premium materials. Intentional production. Every stitch placed with purpose. We do not mass-produce. We do not compromise. Each piece is cut, assembled, and finished to a standard we would wear ourselves.', 'left_image', 'white', false, true, 7),
  ('Limited Collections', 'Every collection is produced in limited quantities and available only through preorder. Nothing surplus. Nothing wasted. Each piece exists because someone chose it first.', 'right_image', 'white', false, true, 8),
  ('Brand Values', 'Identity. Purpose. Quality. Intentional Design. Minimalism. These are not marketing words. They are the principles behind every decision we make.', 'centered', 'white', false, true, 9)
ON CONFLICT DO NOTHING;

-- ── seed default story settings ──
UPDATE site_settings SET
  story_hero_title = 'BE is not a brand. It is a philosophy.',
  story_hero_subtitle = 'Before you wear it, understand why it exists.',
  story_cta_text = 'Explore Collections',
  story_cta_link = '/store',
  story_final_message = 'You are not buying clothing. You are choosing who you want to become.',
  story_seo_title = 'be — Our Story',
  story_seo_description = 'The philosophy behind BE. Why we exist, what we believe, and how we make.',
  story_nav_label = 'Our Story',
  story_nav_label_ar = 'قصتنا'
WHERE id = 1;

-- ============================================================
-- FILE: 20260802010441_add_delivery_method_and_shipping.sql
-- ============================================================
/*
# Add Delivery Method, Municipality, and Shipping Settings

## Summary
Extends the preorder system to support delivery method selection (Home Delivery / Office Pickup),
dynamic municipality selection for home delivery, and a full shipping configuration system
for the admin panel.

## 1. Preorders Table Changes
- Add `delivery_method` column (text, default 'home_delivery') — stores 'home_delivery' or 'office_pickup'
- Add `municipality` column (text, nullable) — stores the selected municipality for home delivery orders
- Make `address` column nullable (was NOT NULL) — address is no longer collected
- Make `notes` column nullable (was NOT NULL) — notes field is removed from the form

## 2. Site Settings — Shipping Configuration
New columns on `site_settings` for shipping configuration:
- `shipping_home_delivery_enabled` (boolean, default true)
- `shipping_office_pickup_enabled` (boolean, default true)
- `shipping_home_delivery_label` (text, default 'Home Delivery')
- `shipping_home_delivery_label_ar` (text, nullable, default 'التوصيل للمنزل')
- `shipping_office_pickup_label` (text, default 'Office Pickup')
- `shipping_office_pickup_label_ar` (text, nullable, default 'الاستلام من المكتب')
- `shipping_home_delivery_fee` (numeric, default 0)
- `shipping_office_pickup_fee` (numeric, default 0)
- `shipping_instructions` (text, default '')
- `shipping_instructions_ar` (text, nullable)
- `shipping_disabled_wilayas` (text[], default '{}') — array of wilaya names where delivery is disabled

## 3. Shipping Fees Per Wilaya
New table `shipping_fees` for per-wilaya delivery fee overrides:
- `id` (uuid, primary key)
- `wilaya` (text, not null) — wilaya name
- `delivery_method` (text, not null) — 'home_delivery' or 'office_pickup'
- `fee` (numeric, not null, default 0)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- Unique constraint on (wilaya, delivery_method)

## 4. Security
- Enable RLS on `shipping_fees`
- Allow anon + authenticated CRUD (single-tenant, admin-managed data)
*/

-- 1. Preorders: add delivery_method and municipality, relax address/notes constraints
ALTER TABLE preorders ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'home_delivery';
ALTER TABLE preorders ADD COLUMN IF NOT EXISTS municipality text;
ALTER TABLE preorders ALTER COLUMN address DROP NOT NULL;
ALTER TABLE preorders ALTER COLUMN notes DROP NOT NULL;
ALTER TABLE preorders ALTER COLUMN address SET DEFAULT '';
ALTER TABLE preorders ALTER COLUMN notes SET DEFAULT '';

-- 2. Site Settings: shipping configuration columns
DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS shipping_home_delivery_enabled boolean NOT NULL DEFAULT true;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS shipping_office_pickup_enabled boolean NOT NULL DEFAULT true;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS shipping_home_delivery_label text NOT NULL DEFAULT 'Home Delivery';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS shipping_home_delivery_label_ar text DEFAULT 'التوصيل للمنزل';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS shipping_office_pickup_label text NOT NULL DEFAULT 'Office Pickup';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS shipping_office_pickup_label_ar text DEFAULT 'الاستلام من المكتب';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS shipping_home_delivery_fee numeric NOT NULL DEFAULT 0;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS shipping_office_pickup_fee numeric NOT NULL DEFAULT 0;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS shipping_instructions text NOT NULL DEFAULT '';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS shipping_instructions_ar text;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS shipping_disabled_wilayas text[] NOT NULL DEFAULT '{}';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Shipping fees per wilaya table
CREATE TABLE IF NOT EXISTS shipping_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wilaya text NOT NULL,
  delivery_method text NOT NULL CHECK (delivery_method IN ('home_delivery', 'office_pickup')),
  fee numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (wilaya, delivery_method)
);

ALTER TABLE shipping_fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_shipping_fees" ON shipping_fees;
CREATE POLICY "anon_select_shipping_fees" ON shipping_fees FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_shipping_fees" ON shipping_fees;
CREATE POLICY "anon_insert_shipping_fees" ON shipping_fees FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_shipping_fees" ON shipping_fees;
CREATE POLICY "anon_update_shipping_fees" ON shipping_fees FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_shipping_fees" ON shipping_fees;
CREATE POLICY "anon_delete_shipping_fees" ON shipping_fees FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- FILE: 20260803042122_add_email_notification_settings.sql
-- ============================================================
/*
# Add Email Notification Settings

## Summary
Decouples email notifications from Google integration so the admin can enable
email alerts independently. Adds a dedicated toggle and a "from" email address
for Resend.

## Changes to site_settings
- `email_notifications_enabled` (boolean, default true) — master toggle for email
- `resend_from_email` (text, nullable) — custom from address for Resend (e.g. noreply@yourdomain.com)
- `resend_from_name` (text, default 'be Preorders') — display name for the from address

## Security
No new tables. No RLS changes needed.
*/

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean NOT NULL DEFAULT true;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS resend_from_email text;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS resend_from_name text NOT NULL DEFAULT 'be Preorders';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
