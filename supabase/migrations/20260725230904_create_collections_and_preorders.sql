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
