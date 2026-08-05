import { supabase } from './supabase';

const BUCKET = 'images';

export interface UploadedImage {
  path: string;
  url: string;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

function isAccepted(file: File): boolean {
  return ACCEPTED.includes(file.type) || /\.(jpe?g|png|webp|svg)$/i.test(file.name);
}

// Generate a safe, unique storage path for an upload.
function makePath(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  return safe;
}

// Downscale + recompress an image in the browser before upload.
// Keeps SVGs untouched. Returns a File ready to upload.
async function optimize(file: File, maxDim = 2000, quality = 0.82): Promise<File> {
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return file;
  }
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('compress failed'))),
      'image/webp',
      quality
    );
  });
  const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
  return new File([blob], name, { type: 'image/webp' });
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  if (!isAccepted(file)) {
    throw new Error('Unsupported file type. Use JPG, PNG, WEBP, or SVG.');
  }
  const optimized = await optimize(file);
  const path = makePath(optimized);
  const { error } = await supabase.storage.from(BUCKET).upload(path, optimized, {
    cacheControl: '3600',
    upsert: false,
    contentType: optimized.type,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function deleteImage(path: string): Promise<void> {
  if (!path) return;
  // Only delete paths inside our bucket (strip any leading slash).
  const key = path.replace(/^\/+/, '').replace(/^images\/+/, '');
  if (!key) return;
  await supabase.storage.from(BUCKET).remove([key]);
}

// Extract the storage key from a public URL so we can delete it later.
export function pathFromUrl(url: string): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    const idx = u.pathname.indexOf('/images/');
    if (idx === -1) return '';
    return decodeURIComponent(u.pathname.slice(idx + '/images/'.length));
  } catch {
    return '';
  }
}
