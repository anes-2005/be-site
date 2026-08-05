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