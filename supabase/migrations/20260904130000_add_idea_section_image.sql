/*
# Add Idea Section Background Image

## Summary
Supports the new "Give Us Your Ideas" section design: a full-bleed
inspirational background image with a floating glass card holding the form,
instead of a plain section. The image is admin-editable, with the home
hero image used as a graceful fallback if none is set.

## Changes to site_settings
- `idea_section_image` (text, nullable) — background image behind the
  "Give Us Your Ideas" section on the home page.

## Security
No RLS changes needed — covered by existing site_settings policies.
*/

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS idea_section_image text;
