import { useEffect, useState, useCallback } from 'react';
import { supabase, type StorySection, type StoryLayout, type StoryBackground } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';
import { saveSettings, type SiteSettings } from '@/lib/settings';
import { AdminLayout } from './AdminLayout';
import { useSeo } from '@/lib/seo';
import { Button } from '@/components/Button';
import { ImageUpload } from '@/components/ImageUpload';
import {
  Loader2, Save, Check, Plus, Trash2, AlertCircle,
  GripVertical, Eye, EyeOff, Copy, ArrowUp, ArrowDown,
} from 'lucide-react';

const LAYOUTS: { value: StoryLayout; label: string }[] = [
  { value: 'text_only', label: 'Text Only' },
  { value: 'centered', label: 'Centered' },
  { value: 'left_image', label: 'Left Image' },
  { value: 'right_image', label: 'Right Image' },
  { value: 'full_width', label: 'Full Width' },
  { value: 'image_only', label: 'Image Only' },
];

const BACKGROUNDS: { value: StoryBackground; label: string }[] = [
  { value: 'white', label: 'White' },
  { value: 'brand', label: 'Brand Color' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
];

export function AdminBrandStory() {
  useSeo({ title: 'be — Brand Story', description: 'Edit your Brand Story page.' });
  const { settings, reload } = useSettings();
  const [sections, setSections] = useState<StorySection[]>([]);
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('story_sections')
        .select('*')
        .order('display_order', { ascending: true });
      if (active) {
        setSections((data as StorySection[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => { setDraft(settings); }, [settings]);

  const setSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  const updateSection = (id: string, patch: Partial<StorySection>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const saveSection = async (s: StorySection) => {
    const { id: _id, created_at: _ca, updated_at: _ua, ...patch } = s;
    await supabase.from('story_sections').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', s.id);
  };

  const addSection = async () => {
    const newOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.display_order)) + 1 : 1;
    const { data } = await supabase
      .from('story_sections')
      .insert({ title: 'New Section', content: '', layout: 'text_only', background: 'white', is_quote: false, published: true, display_order: newOrder })
      .select('*')
      .single();
    if (data) setSections((prev) => [...prev, data as StorySection]);
  };

  const deleteSection = async (id: string) => {
    await supabase.from('story_sections').delete().eq('id', id);
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const duplicateSection = async (s: StorySection) => {
    const newOrder = Math.max(...sections.map((x) => x.display_order)) + 1;
    const { id: _id, created_at: _ca, updated_at: _ua, ...copy } = s;
    const { data } = await supabase
      .from('story_sections')
      .insert({ ...copy, title: `${s.title} (Copy)`, display_order: newOrder })
      .select('*')
      .single();
    if (data) setSections((prev) => [...prev, data as StorySection]);
  };

  const moveSection = useCallback((index: number, dir: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      // Reorder display_order
      next.forEach((s, i) => { s.display_order = i + 1; });
      return next;
    });
  }, []);

  const saveAll = async () => {
    setSaving(true);
    setError('');
    try {
      // Save all sections
      await Promise.all(sections.map((s) => saveSection(s)));
      // Save settings
      await saveSettings(draft);
      await reload();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Could not save. Please try again.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout active="/admin/story">
        <div className="py-20 text-center text-ink/40">Loading…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="/admin/story">
      <div className="px-6 py-8 md:px-10 md:py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-[2rem] font-light text-primary">Brand Story</h1>
            <p className="mt-1 font-sans text-[13px] text-ink/45">The editorial story behind your brand. Every word is editable.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={saveAll} disabled={saving}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} strokeWidth={1.5} /> : <Save size={15} strokeWidth={1.5} />}
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save All'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-error">
            <AlertCircle size={16} strokeWidth={1.5} />
            <span className="font-sans text-[13px]">{error}</span>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {/* HERO */}
          <Section title="Hero Statement" desc="The first thing visitors see. Large typography, full screen.">
            <BilingualInput label="Hero Title" value={draft.story_hero_title ?? ''} valueAr={draft.story_hero_title_ar} onChange={(v) => setSetting('story_hero_title', v)} onChangeAr={(v) => setSetting('story_hero_title_ar', v)} />
            <BilingualTextarea label="Hero Subtitle" value={draft.story_hero_subtitle ?? ''} valueAr={draft.story_hero_subtitle_ar} onChange={(v) => setSetting('story_hero_subtitle', v)} onChangeAr={(v) => setSetting('story_hero_subtitle_ar', v)} rows={2} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="field-label">Reading Time (minutes)</label>
                <input type="number" className="field-input" min={1} value={draft.story_reading_time} onChange={(e) => setSetting('story_reading_time', Math.max(1, parseInt(e.target.value, 10) || 1))} />
              </div>
              <div>
                <label className="field-label">Nav Label (EN)</label>
                <input className="field-input" value={draft.story_nav_label ?? ''} onChange={(e) => setSetting('story_nav_label', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="field-label">Nav Label (AR)</label>
              <input className="field-input font-arabic" dir="rtl" value={draft.story_nav_label_ar ?? ''} onChange={(e) => setSetting('story_nav_label_ar', e.target.value)} />
            </div>
          </Section>

          {/* STORY SECTIONS */}
          <Section title="Story Sections" desc="Add, reorder, and edit the sections that make up your brand story.">
            <div className="space-y-4">
              {sections.map((s, i) => (
                <div key={s.id} className="rounded-xl border border-line bg-bg-100 p-4">
                  {/* Section header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-ink/30" />
                      <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink/40">{String(i + 1).padStart(2, '0')}</span>
                      {s.is_quote && <span className="rounded-md bg-secondary/10 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.14em] text-secondary">Quote</span>}
                      {s.published ? <span className="rounded-md bg-success/10 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.14em] text-success">Published</span> : <span className="rounded-md bg-warning/10 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.14em] text-warning">Draft</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveSection(i, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/40 hover:bg-bg-200 hover:text-primary" aria-label="Move up"><ArrowUp size={13} strokeWidth={1.5} /></button>
                      <button type="button" onClick={() => moveSection(i, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/40 hover:bg-bg-200 hover:text-primary" aria-label="Move down"><ArrowDown size={13} strokeWidth={1.5} /></button>
                      <button type="button" onClick={() => duplicateSection(s)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/40 hover:bg-bg-200 hover:text-primary" aria-label="Duplicate"><Copy size={13} strokeWidth={1.5} /></button>
                      <button type="button" onClick={() => updateSection(s.id, { published: !s.published })} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/40 hover:bg-bg-200 hover:text-primary" aria-label="Toggle publish">
                        {s.published ? <Eye size={13} strokeWidth={1.5} /> : <EyeOff size={13} strokeWidth={1.5} />}
                      </button>
                      <button type="button" onClick={() => deleteSection(s.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/40 hover:bg-error/10 hover:text-error" aria-label="Delete"><Trash2 size={13} strokeWidth={1.5} /></button>
                    </div>
                  </div>

                  {/* Section fields */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateSection(s.id, { is_quote: !s.is_quote })}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-sans text-[11px] uppercase tracking-[0.14em] transition-colors ${s.is_quote ? 'border-primary bg-primary/5 text-primary' : 'border-line text-ink/50 hover:border-primary/30'}`}
                      >
                        Quote Block
                      </button>
                    </div>

                    {!s.is_quote && (
                      <BilingualInput label="Section Title" value={s.title} valueAr={s.title_ar} onChange={(v) => updateSection(s.id, { title: v })} onChangeAr={(v) => updateSection(s.id, { title_ar: v })} />
                    )}

                    <BilingualTextarea label={s.is_quote ? 'Quote Text' : 'Section Content'} value={s.content} valueAr={s.content_ar} onChange={(v) => updateSection(s.id, { content: v })} onChangeAr={(v) => updateSection(s.id, { content_ar: v })} rows={s.is_quote ? 2 : 4} />

                    {!s.is_quote && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="field-label">Layout</label>
                          <select className="field-input appearance-none" value={s.layout} onChange={(e) => updateSection(s.id, { layout: e.target.value as StoryLayout })}>
                            {LAYOUTS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="field-label">Background</label>
                          <select className="field-input appearance-none" value={s.background} onChange={(e) => updateSection(s.id, { background: e.target.value as StoryBackground })}>
                            {BACKGROUNDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {(s.layout === 'left_image' || s.layout === 'right_image' || s.layout === 'full_width' || s.layout === 'image_only' || s.background === 'image') && !s.is_quote && (
                      <ImageUpload label="Section Image" value={s.image_url} onChange={(v) => updateSection(s.id, { image_url: v })} ratio="4/5" compact hint="Upload an image for this section." />
                    )}

                    {s.background === 'video' && !s.is_quote && (
                      <div>
                        <label className="field-label">Background Video URL</label>
                        <input className="field-input" value={s.video_url ?? ''} onChange={(e) => updateSection(s.id, { video_url: e.target.value })} placeholder="https://…" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addSection} className="inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.18em] text-primary hover:underline">
                <Plus size={13} strokeWidth={1.5} /> Add section
              </button>
            </div>
          </Section>

          {/* FINAL MESSAGE & CTA */}
          <Section title="Final Message & CTA" desc="The closing statement and call-to-action button at the end of the story.">
            <BilingualTextarea label="Final Message" value={draft.story_final_message ?? ''} valueAr={draft.story_final_message_ar} onChange={(v) => setSetting('story_final_message', v)} onChangeAr={(v) => setSetting('story_final_message_ar', v)} rows={2} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BilingualInput label="CTA Button Text" value={draft.story_cta_text ?? ''} valueAr={draft.story_cta_text_ar} onChange={(v) => setSetting('story_cta_text', v)} onChangeAr={(v) => setSetting('story_cta_text_ar', v)} />
              <div>
                <label className="field-label">CTA Button Link</label>
                <input className="field-input" value={draft.story_cta_link ?? ''} onChange={(e) => setSetting('story_cta_link', e.target.value)} placeholder="/store" />
              </div>
            </div>
          </Section>

          {/* SEO */}
          <Section title="SEO Settings" desc="Search engine and social share settings for the Brand Story page.">
            <BilingualInput label="SEO Title" value={draft.story_seo_title ?? ''} valueAr={draft.story_seo_title_ar} onChange={(v) => setSetting('story_seo_title', v)} onChangeAr={(v) => setSetting('story_seo_title_ar', v)} />
            <BilingualTextarea label="SEO Description" value={draft.story_seo_description ?? ''} valueAr={draft.story_seo_description_ar} onChange={(v) => setSetting('story_seo_description', v)} onChangeAr={(v) => setSetting('story_seo_description_ar', v)} rows={2} />
            <ImageUpload label="Open Graph Image" value={draft.story_og_image} onChange={(v) => setSetting('story_og_image', v)} ratio="1.91/1" compact hint="Used for social media share previews." />
          </Section>
        </div>

        {/* Bottom save */}
        <div className="mt-10 flex justify-end border-t border-line pt-6">
          <Button onClick={saveAll} disabled={saving} size="lg">
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} strokeWidth={1.5} /> : <Save size={16} strokeWidth={1.5} />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ---------- shared field components ---------- */

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

function BilingualInput({ label, value, valueAr, onChange, onChangeAr }: { label: string; value: string; valueAr: string | null; onChange: (v: string) => void; onChangeAr: (v: string) => void }) {
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

function BilingualTextarea({ label, value, valueAr, onChange, onChangeAr, rows = 3 }: { label: string; value: string; valueAr: string | null; onChange: (v: string) => void; onChangeAr: (v: string) => void; rows?: number }) {
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
