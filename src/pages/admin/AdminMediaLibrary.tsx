import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { useSeo } from '@/lib/seo';
import { ImageBlock } from '@/components/ImageBlock';
import { uploadImage, deleteImage, pathFromUrl } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { Loader2, Trash2, Copy, Check, AlertCircle, Upload } from 'lucide-react';

interface MediaItem {
  name: string;
  url: string;
  created_at: string;
  size?: number;
}

export function AdminMediaLibrary() {
  useSeo({ title: 'be — Media Library', description: 'Manage uploaded images.' });
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase.storage.from('images').list('', {
      limit: 200,
      sortBy: { column: 'created_at' },
    });
    if (error) {
      setError('Could not load media.');
      setLoading(false);
      return;
    }
    const mapped = (data ?? []).map(async (f) => {
      const { data } = supabase.storage.from('images').getPublicUrl(f.name);
      return { name: f.name, url: data.publicUrl, created_at: f.created_at ?? '', size: (f.metadata as { size?: number } | null)?.size };
    });
    const resolved = await Promise.all(mapped);
    setItems(resolved);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (item: MediaItem) => {
    if (!confirm('Delete this image? It will be removed from storage. Images using it will show a placeholder.')) return;
    const key = pathFromUrl(item.url);
    if (key) await deleteImage(key).catch(() => {});
    setItems((prev) => prev.filter((x) => x.name !== item.name));
  };

  const copyUrl = (url: string) => {
    navigator.clipboard?.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const onFileSelect = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await uploadImage(file);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout active="/admin/media">
      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-[2rem] font-light text-primary">Media Library</h1>
            <p className="mt-1 font-sans text-[13px] text-ink/45">All images uploaded to your site.</p>
          </div>
          <label className="btn-primary inline-flex cursor-pointer items-center gap-2">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} strokeWidth={1.5} />}
            {uploading ? 'Uploading…' : 'Upload Image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => onFileSelect(e.target.files)}
              disabled={uploading}
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-error">
            <AlertCircle size={16} strokeWidth={1.5} />
            <span className="font-sans text-[13px]">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-ink/40">Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-ink/40">No images uploaded yet.</div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => (
              <div key={item.name} className="group card overflow-hidden">
                <div className="relative">
                  <ImageBlock src={item.url} alt={item.name} ratio="1/1" className="!rounded-none" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-primary/0 opacity-0 transition-all duration-300 group-hover:bg-primary/30 group-hover:opacity-100">
                    <button
                      onClick={() => copyUrl(item.url)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg/90 text-primary transition-colors hover:bg-bg"
                      title="Copy URL"
                    >
                      {copied === item.url ? <Check size={15} strokeWidth={1.5} /> : <Copy size={15} strokeWidth={1.5} />}
                    </button>
                    <button
                      onClick={() => remove(item)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg/90 text-error transition-colors hover:bg-bg"
                      title="Delete"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate font-sans text-[11px] text-ink/60">{item.name}</p>
                  {item.created_at && (
                    <p className="mt-0.5 font-sans text-[10px] text-ink/35">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
