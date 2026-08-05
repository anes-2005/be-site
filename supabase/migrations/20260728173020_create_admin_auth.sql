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
  crypt('paliro_20050622', gen_salt('bf')),
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
