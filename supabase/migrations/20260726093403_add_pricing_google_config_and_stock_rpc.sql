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
