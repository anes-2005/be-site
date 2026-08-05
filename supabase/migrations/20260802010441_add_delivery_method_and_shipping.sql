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