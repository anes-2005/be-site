import { useEffect, useState } from 'react';
import { supabase, type Collection, type AvailabilityStatus } from '@/lib/supabase';
import { AdminLayout } from './AdminLayout';
import { useSeo } from '@/lib/seo';
import { navigate } from '@/lib/router';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { ImageUpload } from '@/components/ImageUpload';
import { ImageListUpload } from '@/components/ImageListUpload';
import {
  Loader2, Save, Plus, Check, AlertCircle, ExternalLink,
} from 'lucide-react';

interface Props {
  id: string;
}

const STATUSES: AvailabilityStatus[] = ['available', 'coming_soon', 'sold_out'];

export function AdminCollectionEditor({ id }: Props) {
  useSeo({ title: 'be — Edit Collection', description: 'Edit collection content.' });
  const [c, setC] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from('collections').select('*').eq('id', id).maybeSingle();
      if (active) {
        setC(data as Collection | null);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const update = <K extends keyof Collection>(key: K, value: Collection[K]) => {
    setC((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  };

  const save = async () => {
    if (!c) return;
    setSaving(true);
    setError('');
    const { id: _id, created_at: _ca, updated_at: _ua, ...patch } = c;
    const { error } = await supabase
      .from('collections')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', c.id);
    setSaving(false);
    if (error) setError(error.message);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  if (loading) {
    return (
      <AdminLayout active="/admin/collections">
        <div className="py-20 text-center text-ink/40">Loading…</div>
      </AdminLayout>
    );
  }

  if (!c) {
    return (
      <AdminLayout active="/admin/collections">
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
          <h1 className="font-serif text-[2rem] font-light text-primary">Collection not found</h1>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/admin/collections')}>
            Back to Collections
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="/admin/collections">
      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-[2rem] font-light text-primary">{c.name}</h1>
            {c.published ? <Badge tone="success">Published</Badge> : <Badge tone="warning">Hidden</Badge>}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(`/collection/${encodeURIComponent(c.slug)}`)}>
              <ExternalLink size={15} strokeWidth={1.5} /> View
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} strokeWidth={1.5} /> : <Save size={15} strokeWidth={1.5} />}
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-error">
            <AlertCircle size={16} strokeWidth={1.5} />
            <span className="font-sans text-[13px]">{error}</span>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* LEFT — content fields */}
          <div className="space-y-6">
            <Group title="Content">
              <Input label="Collection Name" value={c.name} onChange={(v) => update('name', v)} />
              <Input label="Collection Name (Arabic)" value={(c as Collection & { name_ar?: string }).name_ar ?? ''} onChange={(v) => update('name_ar' as keyof Collection, v as never)} />
              <Input label="URL Slug" value={c.slug} onChange={(v) => update('slug', v)} hint={`Collection URL: /collection/${c.slug}`} />
              <Textarea label="Short Description" value={c.short_description} onChange={(v) => update('short_description', v)} rows={2} />
              <Textarea label="Short Description (Arabic)" value={(c as Collection & { short_description_ar?: string }).short_description_ar ?? ''} onChange={(v) => update('short_description_ar' as keyof Collection, v as never)} rows={2} />
              <Textarea label="Long Description" value={c.long_description} onChange={(v) => update('long_description', v)} rows={4} />
              <Textarea label="Long Description (Arabic)" value={(c as Collection & { long_description_ar?: string }).long_description_ar ?? ''} onChange={(v) => update('long_description_ar' as keyof Collection, v as never)} rows={4} />
            </Group>

            <Group title="Images">
              <ImageUpload label="Cover Image" value={c.cover_image} onChange={(v) => update('cover_image', v)} ratio="3/4" />
              <ImageListUpload label="Preview Images (three)" values={c.preview_images} onChange={(v) => update('preview_images', v)} min={3} ratio="3/4" />
              <ImageListUpload label="Gallery Images (optional)" values={c.gallery_images} onChange={(v) => update('gallery_images', v)} min={0} ratio="4/5" hint="Upload as many gallery images as you like — there is no limit." />
            </Group>

            <Group title="Pricing">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <PriceInput label="Current Price" value={c.current_price} onChange={(v) => update('current_price', v)} />
                <PriceInput label="Old Price (optional)" value={c.old_price} onChange={(v) => update('old_price', v)} />
                <div>
                  <label className="field-label">Currency</label>
                  <select
                    className="field-input appearance-none"
                    value={c.currency}
                    onChange={(e) => update('currency', e.target.value)}
                  >
                    <option value="DZD">DZD — Algerian Dinar</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="MAD">MAD — Moroccan Dirham</option>
                    <option value="SAR">SAR — Saudi Riyal</option>
                    <option value="AED">AED — UAE Dirham</option>
                    <option value="TND">TND — Tunisian Dinar</option>
                  </select>
                </div>
              </div>
              <p className="font-sans text-[11px] text-ink/40">Leave prices blank to hide pricing for this collection.</p>
            </Group>

            <Group title="SEO">
              <Input label="SEO Title" value={c.seo_title} onChange={(v) => update('seo_title', v)} />
              <Input label="SEO Title (Arabic)" value={(c as Collection & { seo_title_ar?: string }).seo_title_ar ?? ''} onChange={(v) => update('seo_title_ar' as keyof Collection, v as never)} />
              <Textarea label="SEO Description" value={c.seo_description} onChange={(v) => update('seo_description', v)} rows={2} />
              <Textarea label="SEO Description (Arabic)" value={(c as Collection & { seo_description_ar?: string }).seo_description_ar ?? ''} onChange={(v) => update('seo_description_ar' as keyof Collection, v as never)} rows={2} />
              <ImageUpload label="Open Graph Image" value={c.og_image} onChange={(v) => update('og_image', v)} ratio="1.91/1" compact hint="Used for social media share previews." />
            </Group>
          </div>

          {/* RIGHT — status & stock */}
          <div>
            <div className="card sticky top-28 p-6">
              <h3 className="font-sans text-[11px] uppercase tracking-[0.24em] text-ink/60">Status & Stock</h3>

              <div className="mt-6">
                <label className="field-label">Availability</label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => update('availability_status', s)}
                      className={`rounded-xl border px-2 py-2.5 font-sans text-[10px] uppercase tracking-[0.14em] transition-all ${
                        c.availability_status === s
                          ? 'border-primary bg-primary text-bg'
                          : 'border-line text-ink/60 hover:border-primary/40'
                      }`}
                    >
                      {s === 'coming_soon' ? 'Soon' : s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="field-label">Remaining Stock</label>
                <input type="number" className="field-input" value={c.remaining_stock} min={0}
                  onChange={(e) => update('remaining_stock', Math.max(0, parseInt(e.target.value, 10) || 0))} />
              </div>
              <div className="mt-5">
                <label className="field-label">Maximum Stock</label>
                <input type="number" className="field-input" value={c.max_stock} min={1}
                  onChange={(e) => update('max_stock', Math.max(1, parseInt(e.target.value, 10) || 1))} />
              </div>

              <Toggle label="Preorder Enabled" checked={c.preorder_enabled} onChange={(v) => update('preorder_enabled', v)} />
              <Toggle label="Published" checked={c.published} onChange={(v) => update('published', v)} />

              <div className="mt-6">
                <Input label="Instagram Campaign Link" value={c.instagram_link} onChange={(v) => update('instagram_link', v)} />
              </div>
              <div className="mt-5">
                <Input label="Display Order" value={String(c.display_order)} onChange={(v) => update('display_order', parseInt(v, 10) || 0)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ---------- field helpers ---------- */

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 md:p-8">
      <h3 className="font-sans text-[11px] uppercase tracking-[0.24em] text-ink/60 mb-6">{title}</h3>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input className="field-input" value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="mt-2 font-sans text-[11px] text-ink/40">{hint}</p>}
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <textarea className="field-input resize-none" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="mt-5 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-left transition-colors hover:border-primary/30">
      <span className="font-sans text-[12px] uppercase tracking-[0.18em] text-ink/70">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-bg-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-bg shadow transition-all ${checked ? 'left-[1.125rem]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

function PriceInput({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        type="number"
        step="0.01"
        min="0"
        className="field-input"
        value={value ?? ''}
        placeholder="—"
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? null : parseFloat(v));
        }}
      />
    </div>
  );
}
