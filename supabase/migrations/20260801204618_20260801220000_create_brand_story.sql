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