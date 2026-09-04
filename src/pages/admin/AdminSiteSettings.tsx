import { useEffect, useState } from 'react';
import { useSettings } from '@/lib/settings-context';
import { saveSettings, type SiteSettings, type NavLink, type WhyPreorderCard } from '@/lib/settings';
import { AdminLayout } from './AdminLayout';
import { useSeo } from '@/lib/seo';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { ImageUpload } from '@/components/ImageUpload';
import { ImageListUpload } from '@/components/ImageListUpload';
import { Save, Check, Loader2, Plus, Trash2, GripVertical, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { WILAYAS } from '@/lib/wilayas';

export function AdminSiteSettings() {
  useSeo({ title: 'be — Site Settings', description: 'Edit site content' });
  const { settings, reload } = useSettings();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setDraft(settings); }, [settings]);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    const ok = await saveSettings(draft);
    setSaving(false);
    if (ok) {
      setSaved(true);
      await reload();
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError('Could not save. Please try again.');
    }
  };

  const toggleSite = async () => {
    const next = !draft.site_online;
    set('site_online', next);
    setSaving(true);
    await saveSettings({ site_online: next });
    setSaving(false);
    await reload();
  };

  return (
    <AdminLayout active="/admin/settings">
      <div className="px-6 py-8 md:px-10 md:py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-[2rem] font-light text-primary">Site Settings</h1>
            <p className="mt-1 font-sans text-[13px] text-ink/45">Control every piece of content on your site.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={toggleSite} disabled={saving}>
              {draft.site_online ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
              {draft.site_online ? 'Take Offline' : 'Publish Site'}
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} strokeWidth={1.5} /> : <Save size={15} strokeWidth={1.5} />}
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Status banner */}
        <div className={`mt-6 flex items-center gap-3 rounded-xl border px-5 py-3.5 ${draft.site_online ? 'border-success/20 bg-success/5' : 'border-warning/20 bg-warning/5'}`}>
          {draft.site_online ? <Eye size={16} strokeWidth={1.5} className="text-success" /> : <EyeOff size={16} strokeWidth={1.5} className="text-warning" />}
          <span className="font-sans text-[13px] text-ink/70">
            {draft.site_online ? 'Your site is live and visible to visitors.' : 'Your site is offline. Visitors see a "coming soon" page.'}
          </span>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-error">
            <AlertCircle size={16} strokeWidth={1.5} />
            <span className="font-sans text-[13px]">{error}</span>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {/* BRAND */}
          <Section title="Brand" desc="Your brand name, tagline, and logo. Each text field has an Arabic translation.">
            <ImageUpload label="Logo" value={draft.logo_image} onChange={(v) => set('logo_image', v)} ratio="3/1" compact hint="Shown in the top navigation and footer. PNG or SVG with transparency works best." />
            <BilingualInput label="Brand Name" value={draft.brand_name} valueAr={draft.brand_name_ar} onChange={(v) => set('brand_name', v)} onChangeAr={(v) => set('brand_name_ar', v)} />
            <BilingualInput label="Tagline" value={draft.brand_tagline} valueAr={draft.brand_tagline_ar} onChange={(v) => set('brand_tagline', v)} onChangeAr={(v) => set('brand_tagline_ar', v)} />
            <Input label="Instagram URL" value={draft.instagram_url} onChange={(v) => set('instagram_url', v)} />
          </Section>

          {/* HERO */}
          <Section title="Home Hero" desc="The first thing visitors see on your home page.">
            <ImageUpload label="Hero Background Image" value={draft.hero_image} onChange={(v) => set('hero_image', v)} ratio="16/9" hint="Large background image behind the headline on your home page." />
            <BilingualInput label="Headline" value={draft.hero_headline} valueAr={draft.hero_headline_ar} onChange={(v) => set('hero_headline', v)} onChangeAr={(v) => set('hero_headline_ar', v)} />
            <BilingualTextarea label="Subheadline" value={draft.hero_subheadline} valueAr={draft.hero_subheadline_ar} onChange={(v) => set('hero_subheadline', v)} onChangeAr={(v) => set('hero_subheadline_ar', v)} rows={2} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BilingualInput label="Primary Button Text" value={draft.hero_primary_cta} valueAr={draft.hero_primary_cta_ar} onChange={(v) => set('hero_primary_cta', v)} onChangeAr={(v) => set('hero_primary_cta_ar', v)} />
              <BilingualInput label="Secondary Note" value={draft.hero_secondary_note} valueAr={draft.hero_secondary_note_ar} onChange={(v) => set('hero_secondary_note', v)} onChangeAr={(v) => set('hero_secondary_note_ar', v)} />
            </div>
          </Section>

          {/* IDEA SECTION */}
          <Section title="Give Us Your Ideas — Background" desc="The inspirational photo behind the idea-submission section on your home page. Falls back to your Hero image if left empty.">
            <ImageUpload label="Idea Section Background Image" value={draft.idea_section_image} onChange={(v) => set('idea_section_image', v)} ratio="16/9" hint="A workshop, fabric, or sketch photo works well here — something that evokes creativity." />
          </Section>

          {/* TYPOGRAPHY */}
          <Section title="Price Text Size" desc="Control exactly how big the price appears, in pixels. Preview updates instantly as you type — press Save to apply it on the live site.">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="field-label">Large price (home & collection page)</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min={20}
                    max={64}
                    value={draft.price_size_lg_px}
                    onChange={(e) => set('price_size_lg_px', parseInt(e.target.value, 10))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-primary"
                  />
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={draft.price_size_lg_px}
                    onChange={(e) => set('price_size_lg_px', parseInt(e.target.value, 10) || 0)}
                    className="field-input !w-20 text-center"
                  />
                  <span className="font-sans text-[12px] text-ink/40">px</span>
                </div>
                <div className="mt-4 flex min-h-[70px] items-center justify-center rounded-xl border border-line bg-bg-100 px-4 py-3">
                  <span className="font-serif font-light text-primary" style={{ fontSize: `${draft.price_size_lg_px}px` }}>DZD 4,500</span>
                </div>
              </div>

              <div>
                <label className="field-label">Small price (store cards)</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min={10}
                    max={32}
                    value={draft.price_size_sm_px}
                    onChange={(e) => set('price_size_sm_px', parseInt(e.target.value, 10))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-primary"
                  />
                  <input
                    type="number"
                    min={8}
                    max={60}
                    value={draft.price_size_sm_px}
                    onChange={(e) => set('price_size_sm_px', parseInt(e.target.value, 10) || 0)}
                    className="field-input !w-20 text-center"
                  />
                  <span className="font-sans text-[12px] text-ink/40">px</span>
                </div>
                <div className="mt-4 flex min-h-[70px] items-center justify-center rounded-xl border border-line bg-bg-100 px-4 py-3">
                  <span className="font-serif font-light text-primary" style={{ fontSize: `${draft.price_size_sm_px}px` }}>DZD 4,500</span>
                </div>
              </div>
            </div>
          </Section>

          {/* EXPLORE COLLECTIONS COVER TEXT */}
          <Section title="Explore Collections — Cover Text" desc="Control the 'BE / WORD' text shown over each collection's cover photo.">
            <Toggle
              label="Show cover text"
              checked={draft.explore_cover_text_visible}
              onChange={(v) => set('explore_cover_text_visible', v)}
            />
            <div className="mt-5">
              <label className="field-label">Text color</label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={draft.explore_cover_text_color || '#F8F5EF'}
                  onChange={(e) => set('explore_cover_text_color', e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-transparent p-1"
                />
                <input
                  type="text"
                  value={draft.explore_cover_text_color ?? ''}
                  onChange={(e) => set('explore_cover_text_color', e.target.value || null)}
                  placeholder="Auto (rotates gold / cream / soft blue)"
                  className="field-input flex-1"
                />
                {draft.explore_cover_text_color && (
                  <button
                    type="button"
                    onClick={() => set('explore_cover_text_color', null)}
                    className="whitespace-nowrap font-sans text-[12px] text-ink/40 underline-offset-4 hover:text-primary hover:underline"
                  >
                    Reset to auto
                  </button>
                )}
              </div>
              <p className="mt-2 font-sans text-[12px] text-ink/40">Leave empty to keep the automatic rotating brand colors — one per card.</p>
            </div>
          </Section>

          <Section title="Why Preorder Cards" desc="The three cards under the collection preview on the home page.">
            <ListEditor
              items={draft.why_preorder}
              onChange={(v) => set('why_preorder', v)}
              render={(item, set) => (
                <>
                  <Input label="Title" value={item.title} onChange={(v) => set({ ...item, title: v })} />
                  <Textarea label="Body" value={item.body} onChange={(v) => set({ ...item, body: v })} rows={2} />
                </>
              )}
              makeNew={() => ({ title: 'New Card', body: '' })}
              addLabel="Add card"
            />
          </Section>

          {/* ABOUT */}
          <Section title="About Page" desc="The content on your About page.">
            <BilingualInput label="Title" value={draft.about_title} valueAr={draft.about_title_ar} onChange={(v) => set('about_title', v)} onChangeAr={(v) => set('about_title_ar', v)} />
            <ParagraphListEditor
              items={draft.about_paragraphs}
              onChange={(v) => set('about_paragraphs', v)}
            />
            <ImageListUpload label="About Page Images" values={draft.about_images} onChange={(v) => set('about_images', v)} min={0} ratio="4/5" hint="Images shown on your About page. Add as many as you like." />
            <BilingualInput label="Button Label" value={draft.about_cta_label} valueAr={draft.about_cta_label_ar} onChange={(v) => set('about_cta_label', v)} onChangeAr={(v) => set('about_cta_label_ar', v)} />
          </Section>

          {/* NAVIGATION */}
          <Section title="Navigation" desc="The links in your site's top menu.">
            <ListEditor
              items={draft.nav_links}
              onChange={(v) => set('nav_links', v)}
              render={(item, set) => (
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Label" value={item.label} onChange={(v) => set({ ...item, label: v })} />
                  <Input label="Link" value={item.to} onChange={(v) => set({ ...item, to: v })} />
                </div>
              )}
              makeNew={() => ({ label: 'New Link', to: '/' })}
              addLabel="Add link"
            />
          </Section>

          {/* SHIPPING */}
          <Section title="Shipping & Delivery" desc="Configure delivery methods, fees, and restrictions.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-line bg-bg-100 px-4 py-3.5">
                <div>
                  <span className="font-sans text-[13px] text-ink/70">Home Delivery</span>
                  <p className="mt-0.5 font-sans text-[11px] text-ink/40">Deliver to customer's municipality</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('shipping_home_delivery_enabled', !draft.shipping_home_delivery_enabled)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${draft.shipping_home_delivery_enabled ? 'bg-primary' : 'bg-ink/20'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${draft.shipping_home_delivery_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-line bg-bg-100 px-4 py-3.5">
                <div>
                  <span className="font-sans text-[13px] text-ink/70">Office Pickup</span>
                  <p className="mt-0.5 font-sans text-[11px] text-ink/40">Pickup at shipping office</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('shipping_office_pickup_enabled', !draft.shipping_office_pickup_enabled)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${draft.shipping_office_pickup_enabled ? 'bg-primary' : 'bg-ink/20'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${draft.shipping_office_pickup_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BilingualInput label="Home Delivery Label" value={draft.shipping_home_delivery_label} valueAr={draft.shipping_home_delivery_label_ar} onChange={(v) => set('shipping_home_delivery_label', v)} onChangeAr={(v) => set('shipping_home_delivery_label_ar', v)} />
              <BilingualInput label="Office Pickup Label" value={draft.shipping_office_pickup_label} valueAr={draft.shipping_office_pickup_label_ar} onChange={(v) => set('shipping_office_pickup_label', v)} onChangeAr={(v) => set('shipping_office_pickup_label_ar', v)} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="field-label">Home Delivery Fee (DA)</label>
                <input type="number" className="field-input" min={0} step="any" value={draft.shipping_home_delivery_fee} onChange={(e) => set('shipping_home_delivery_fee', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="field-label">Office Pickup Fee (DA)</label>
                <input type="number" className="field-input" min={0} step="any" value={draft.shipping_office_pickup_fee} onChange={(e) => set('shipping_office_pickup_fee', parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <BilingualTextarea label="Delivery Instructions" value={draft.shipping_instructions} valueAr={draft.shipping_instructions_ar} onChange={(v) => set('shipping_instructions', v)} onChangeAr={(v) => set('shipping_instructions_ar', v)} rows={2} />

            <div>
              <label className="field-label">Disabled Wilayas</label>
              <p className="mb-3 font-sans text-[11px] text-ink/40">Select wilayas where delivery is not available.</p>
              <div className="flex flex-wrap gap-2">
                {WILAYAS.map((w) => {
                  const active = (draft.shipping_disabled_wilayas ?? []).includes(w);
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => {
                        const current = draft.shipping_disabled_wilayas ?? [];
                        set('shipping_disabled_wilayas', active ? current.filter((x) => x !== w) : [...current, w]);
                      }}
                      className={`rounded-lg border px-3 py-1.5 font-sans text-[11px] transition-colors ${active ? 'border-error/30 bg-error/5 text-error' : 'border-line text-ink/50 hover:border-primary/30'}`}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* SEO */}
          <Section title="SEO & Footer" desc="Default search engine and social share settings.">
            <BilingualInput label="Default SEO Title" value={draft.seo_title} valueAr={draft.seo_title_ar} onChange={(v) => set('seo_title', v)} onChangeAr={(v) => set('seo_title_ar', v)} />
            <BilingualTextarea label="Default SEO Description" value={draft.seo_description} valueAr={draft.seo_description_ar} onChange={(v) => set('seo_description', v)} onChangeAr={(v) => set('seo_description_ar', v)} rows={2} />
            <ImageUpload label="Default Open Graph Image" value={draft.og_image} onChange={(v) => set('og_image', v)} ratio="1.91/1" compact hint="Used for social media share previews when no collection image is set." />
            <BilingualInput label="Footer Note" value={draft.footer_note} valueAr={draft.footer_note_ar} onChange={(v) => set('footer_note', v)} onChangeAr={(v) => set('footer_note_ar', v)} />
          </Section>
        </div>

        {/* Bottom save */}
        <div className="mt-10 flex justify-end border-t border-line pt-6">
          <Button onClick={save} disabled={saving} size="lg">
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} strokeWidth={1.5} /> : <Save size={16} strokeWidth={1.5} />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ---------- shared field components ---------- */

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-left transition-colors hover:border-primary/30">
      <span className="font-sans text-[12px] uppercase tracking-[0.18em] text-ink/70">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-bg-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-bg shadow transition-all ${checked ? 'left-[1.125rem]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 md:p-8">
      <div className="mb-6">
        <h2 className="font-serif text-[1.5rem] font-light text-primary">{title}</h2>
        {desc && <p className="mt-1 font-sans text-[12px] text-ink/45">{desc}</p>}
      </div>
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

function BilingualInput({
  label, value, valueAr, onChange, onChangeAr,
}: {
  label: string;
  value: string;
  valueAr: string | null;
  onChange: (v: string) => void;
  onChangeAr: (v: string) => void;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div>
          <span className="mb-1 block font-sans text-[10px] uppercase tracking-[0.18em] text-ink/35">EN</span>
          <input className="field-input" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
        <div>
          <span className="mb-1 block font-sans text-[10px] uppercase tracking-[0.18em] text-ink/35">AR</span>
          <input className="field-input font-arabic" dir="rtl" value={valueAr ?? ''} onChange={(e) => onChangeAr(e.target.value)} placeholder="—" />
        </div>
      </div>
    </div>
  );
}

function BilingualTextarea({
  label, value, valueAr, onChange, onChangeAr, rows = 3,
}: {
  label: string;
  value: string;
  valueAr: string | null;
  onChange: (v: string) => void;
  onChangeAr: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div>
          <span className="mb-1 block font-sans text-[10px] uppercase tracking-[0.18em] text-ink/35">EN</span>
          <textarea className="field-input resize-none" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
        <div>
          <span className="mb-1 block font-sans text-[10px] uppercase tracking-[0.18em] text-ink/35">AR</span>
          <textarea className="field-input resize-none font-arabic" dir="rtl" rows={rows} value={valueAr ?? ''} onChange={(e) => onChangeAr(e.target.value)} placeholder="—" />
        </div>
      </div>
    </div>
  );
}

function ListEditor<T extends { title?: string; label?: string }>({
  items, onChange, render, makeNew, addLabel,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  render: (item: T, set: (v: T) => void) => React.ReactNode;
  makeNew: () => T;
  addLabel: string;
}) {
  const set = (i: number, v: T) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => onChange([...items, makeNew()]);

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-line bg-bg-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink/40">{String(i + 1).padStart(2, '0')}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} className="text-ink/30 hover:text-primary" aria-label="Move up"><GripVertical size={14} /></button>
              <button type="button" onClick={() => remove(i)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/40 hover:bg-error/10 hover:text-error" aria-label="Remove">
                <Trash2 size={13} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          {render(item, (v) => set(i, v))}
        </div>
      ))}
      <button type="button" onClick={add} className="inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.18em] text-primary hover:underline">
        <Plus size={13} strokeWidth={1.5} /> {addLabel}
      </button>
    </div>
  );
}

function ParagraphListEditor({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  const set = (i: number, v: string) => { const next = [...items]; next[i] = v; onChange(next); };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, '']);

  return (
    <div className="space-y-3">
      <label className="field-label">Paragraphs</label>
      {items.map((p, i) => (
        <div key={i} className="flex gap-2">
          <textarea className="field-input resize-none" rows={2} value={p} onChange={(e) => set(i, e.target.value)} />
          <button type="button" onClick={() => remove(i)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink/40 hover:border-error/30 hover:text-error">
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.18em] text-primary hover:underline">
        <Plus size={13} strokeWidth={1.5} /> Add paragraph
      </button>
    </div>
  );
}
