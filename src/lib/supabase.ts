import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type AvailabilityStatus = 'available' | 'coming_soon' | 'sold_out';

export interface Collection {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  hero_image: string | null;
  cover_image: string | null;
  preview_images: string[];
  gallery_images: string[];
  short_description: string;
  short_description_ar: string | null;
  long_description: string;
  long_description_ar: string | null;
  remaining_stock: number;
  max_stock: number;
  availability_status: AvailabilityStatus;
  preorder_enabled: boolean;
  instagram_link: string;
  published: boolean;
  display_order: number;
  seo_title: string;
  seo_title_ar: string | null;
  seo_description: string;
  seo_description_ar: string | null;
  og_image: string | null;
  current_price: number | null;
  old_price: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export type DeliveryMethod = 'home_delivery' | 'office_pickup';

export interface Preorder {
  id: string;
  collection_id: string | null;
  full_name: string;
  phone: string;
  email: string;
  address: string | null;
  wilaya: string;
  municipality: string | null;
  delivery_method: DeliveryMethod;
  size: string;
  quantity: number;
  notes: string | null;
  acknowledged: boolean;
  status: 'received' | 'confirmed' | 'cancelled';
  created_at: string;
}

export interface ShippingFee {
  id: string;
  wilaya: string;
  delivery_method: DeliveryMethod;
  fee: number;
  created_at: string;
  updated_at: string;
}

export type CollectionInput = Omit<Collection, 'id' | 'created_at' | 'updated_at'>;

export type StoryLayout = 'left_image' | 'right_image' | 'centered' | 'full_width' | 'text_only' | 'image_only';
export type StoryBackground = 'white' | 'brand' | 'image' | 'video';

export interface StorySection {
  id: string;
  title: string;
  title_ar: string | null;
  content: string;
  content_ar: string | null;
  layout: StoryLayout;
  background: StoryBackground;
  image_url: string | null;
  video_url: string | null;
  is_quote: boolean;
  published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type StorySectionInput = Omit<StorySection, 'id' | 'created_at' | 'updated_at'>;
