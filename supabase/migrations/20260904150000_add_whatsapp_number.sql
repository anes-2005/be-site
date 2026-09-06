/*
# Add WhatsApp Contact Number

## Summary
Powers a floating WhatsApp button shown on every public page, so visitors
can reach you instantly. Editable from /admin/settings — no code change
needed if the number ever changes.

## Changes to site_settings
- `whatsapp_number` (text, nullable) — full international number, digits
  only, no leading "+" (e.g. "213560309140"). The button is hidden if empty.

## Security
No RLS changes needed — covered by existing site_settings policies.
*/

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whatsapp_number text;

UPDATE site_settings SET whatsapp_number = '213560309140' WHERE id = 1 AND whatsapp_number IS NULL;
