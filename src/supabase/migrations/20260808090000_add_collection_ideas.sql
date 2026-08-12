/*
# Add Collection Ideas Table

## Summary
Stores visitor suggestions submitted from the new "Give Us Your Ideas" box
on the home page, so the admin can review them in /admin and also receive
an email notification per submission.

## New Tables
- `collection_ideas`
  - `id` (uuid, primary key)
  - `name` (text) — submitter's name
  - `contact` (text, nullable) — email or phone, optional
  - `message` (text) — the idea itself
  - `status` (text, default 'new') — new | reviewed | archived
  - `created_at` (timestamptz, default now())

## Security
- RLS enabled.
- `insert_collection_ideas`: anyone (anon) can insert — the public suggestion form.
- `read_collection_ideas`: anyone (anon) can read — matches this project's existing
  pattern where the admin panel authenticates client-side and reads via anon key
  (see `preorders` table policies).
- `update_collection_ideas` / `delete_collection_ideas`: anon can update status or
  delete, consistent with how /admin manages preorders.
*/

CREATE TABLE IF NOT EXISTS collection_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE collection_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_collection_ideas" ON collection_ideas;
CREATE POLICY "insert_collection_ideas"
ON collection_ideas FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "read_collection_ideas" ON collection_ideas;
CREATE POLICY "read_collection_ideas"
ON collection_ideas FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "update_collection_ideas" ON collection_ideas;
CREATE POLICY "update_collection_ideas"
ON collection_ideas FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "delete_collection_ideas" ON collection_ideas;
CREATE POLICY "delete_collection_ideas"
ON collection_ideas FOR DELETE
TO anon, authenticated
USING (true);
