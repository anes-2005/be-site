import { supabase } from './supabase';

export interface NavLink {
  label: string;
  to: string;
}

export interface WhyPreorderCard {
  title: string;
  body: string;
}

export interface SiteSettings {
  id: number;
  site_online: boolean;
  brand_name: string;
  brand_name_ar: string | null;
  brand_tagline: string;
  brand_tagline_ar: string | null;
  instagram_url: string;
  hero_headline: string;
  hero_headline_ar: string | null;
  hero_subheadline: string;
  hero_subheadline_ar: string | null;
  hero_primary_cta: string;
  hero_primary_cta_ar: string | null;
  hero_secondary_note: string;
  hero_secondary_note_ar: string | null;
  why_preorder: WhyPreorderCard[];
  about_title: string;
  about_title_ar: string | null;
  about_paragraphs: string[];
  about_cta_label: string;
  about_cta_label_ar: string | null;
  seo_title: string;
  seo_title_ar: string | null;
  seo_description: string;
  seo_description_ar: string | null;
  nav_links: NavLink[];
  footer_note: string;
  footer_note_ar: string | null;
  logo_image: string | null;
  hero_image: string | null;
  about_images: string[];
  og_image: string | null;
  google_enabled: boolean;
  gmail_address: string | null;
  google_sheet_id: string | null;
  google_sheet_tab: string;
  google_service_account: string | null;
  story_nav_label: string | null;
  story_nav_label_ar: string | null;
  story_hero_title: string | null;
  story_hero_title_ar: string | null;
  story_hero_subtitle: string | null;
  story_hero_subtitle_ar: string | null;
  story_reading_time: number;
  story_cta_text: string | null;
  story_cta_text_ar: string | null;
  story_cta_link: string | null;
  story_final_message: string | null;
  story_final_message_ar: string | null;
  story_seo_title: string | null;
  story_seo_title_ar: string | null;
  story_seo_description: string | null;
  story_seo_description_ar: string | null;
  story_og_image: string | null;
  shipping_home_delivery_enabled: boolean;
  shipping_office_pickup_enabled: boolean;
  shipping_home_delivery_label: string;
  shipping_home_delivery_label_ar: string | null;
  shipping_office_pickup_label: string;
  shipping_office_pickup_label_ar: string | null;
  shipping_home_delivery_fee: number;
  shipping_office_pickup_fee: number;
  shipping_instructions: string;
  shipping_instructions_ar: string | null;
  shipping_disabled_wilayas: string[];
  email_notifications_enabled: boolean;
  resend_from_email: string | null;
  resend_from_name: string;
  updated_at: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  site_online: true,
  brand_name: 'be',
  brand_name_ar: null,
  brand_tagline: 'Be Different',
  brand_tagline_ar: null,
  instagram_url: 'https://www.instagram.com/beva.tht',
  hero_headline: 'BE DIFFERENT',
  hero_headline_ar: null,
  hero_subheadline: 'Limited preorder. Only 100 pieces will ever be available.',
  hero_subheadline_ar: null,
  hero_primary_cta: 'Preorder Now',
  hero_primary_cta_ar: null,
  hero_secondary_note: 'Estimated shipping after production.',
  hero_secondary_note_ar: null,
  why_preorder: [
    { title: 'Limited Collection', body: 'A fixed run of 100 pieces. Once they are reserved, no more will be made.' },
    { title: 'Premium Materials', body: 'Selected fabrics and finishes, cut and assembled to a luxury standard.' },
    { title: 'Made Only For Those Who Reserve', body: 'Each piece is produced to order for the person who claimed it — nothing surplus.' },
  ],
  about_title: 'Made to be different.',
  about_title_ar: null,
  about_paragraphs: [
    'be is a clothing brand built on restraint. We make limited runs, produced only for those who reserve them.',
    'No surplus. No compromise. Each piece is cut from premium materials and assembled to a luxury standard. Preordering is not a wait — it is the point. It is how we ensure nothing is made that does not need to exist.',
    'We begin with one collection. Over time, the store will grow — but the principle will not change.',
  ],
  about_cta_label: 'Instagram',
  about_cta_label_ar: null,
  seo_title: 'be — Limited Preorder',
  seo_title_ar: null,
  seo_description: 'be. A limited preorder collection. Only 100 pieces will ever be available.',
  seo_description_ar: null,
  nav_links: [
    { label: 'Home', to: '/' },
    { label: 'Store', to: '/store' },
    { label: 'About', to: '/about' },
  ],
  footer_note: 'All rights reserved.',
  footer_note_ar: null,
  logo_image: null,
  hero_image: null,
  about_images: [],
  og_image: null,
  google_enabled: false,
  gmail_address: null,
  google_sheet_id: null,
  google_sheet_tab: 'Preorders',
  google_service_account: null,
  story_nav_label: 'Our Story',
  story_nav_label_ar: 'قصتنا',
  story_hero_title: null,
  story_hero_title_ar: null,
  story_hero_subtitle: null,
  story_hero_subtitle_ar: null,
  story_reading_time: 3,
  story_cta_text: null,
  story_cta_text_ar: null,
  story_cta_link: null,
  story_final_message: null,
  story_final_message_ar: null,
  story_seo_title: null,
  story_seo_title_ar: null,
  story_seo_description: null,
  story_seo_description_ar: null,
  story_og_image: null,
  shipping_home_delivery_enabled: true,
  shipping_office_pickup_enabled: true,
  shipping_home_delivery_label: 'Home Delivery',
  shipping_home_delivery_label_ar: 'التوصيل للمنزل',
  shipping_office_pickup_label: 'Office Pickup',
  shipping_office_pickup_label_ar: 'الاستلام من المكتب',
  shipping_home_delivery_fee: 0,
  shipping_office_pickup_fee: 0,
  shipping_instructions: '',
  shipping_instructions_ar: null,
  shipping_disabled_wilayas: [],
  email_notifications_enabled: true,
  resend_from_email: null,
  resend_from_name: 'be Preorders',
  updated_at: '',
};

export async function fetchSettings(): Promise<SiteSettings> {
  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  const row = data as Partial<SiteSettings> & { google_service_account?: unknown };
  // google_service_account is jsonb — normalize to a pretty string for the textarea.
  if (row.google_service_account && typeof row.google_service_account === 'object') {
    row.google_service_account = JSON.stringify(row.google_service_account, null, 2);
  }
  return row as SiteSettings;
}

export async function saveSettings(patch: Partial<SiteSettings>): Promise<boolean> {
  const payload: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
  // Normalize the service account string back to an object for the jsonb column.
  if (typeof payload.google_service_account === 'string') {
    const trimmed = payload.google_service_account.trim();
    if (trimmed === '') {
      payload.google_service_account = null;
    } else {
      try {
        payload.google_service_account = JSON.parse(trimmed);
      } catch {
        // Let the DB reject malformed JSON; pass the string through.
      }
    }
  }
  const { error } = await supabase
    .from('site_settings')
    .update(payload)
    .eq('id', 1);
  return !error;
}
