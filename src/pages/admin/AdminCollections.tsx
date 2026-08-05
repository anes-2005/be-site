import { useEffect, useState } from 'react';
import { supabase, type Collection } from '@/lib/supabase';
import { AdminLayout } from './AdminLayout';
import { useSeo } from '@/lib/seo';
import { navigate } from '@/lib/router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ImageBlock } from '@/components/ImageBlock';
import {
  Plus, Copy, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Pencil, Loader2,
} from 'lucide-react';

const statusTone = {
  available: 'success',
  coming_soon: 'warning',
  sold_out: 'error',
} as const;
const statusLabel = {
  available: 'Available',
  coming_soon: 'Coming Soon',
  sold_out: 'Sold Out',
} as const;

export function AdminCollections() {
  useSeo({ title: 'be — Collections', description: 'Manage collections' });
  const [items, setItems] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('collections').select('*').order('display_order', { ascending: true });
    setItems((data as Collection[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setBusy('new');
    const order = (items[items.length - 1]?.display_order ?? 0) + 1;
    const slug = `collection-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from('collections')
      .insert({
        name: 'Untitled Collection', slug, short_description: '', long_description: '',
        preview_images: ['', '', ''], gallery_images: [], remaining_stock: 100, max_stock: 100,
        availability_status: 'coming_soon', preorder_enabled: false, published: false, display_order: order,
      })
      .select().single();
    setBusy(null);
    if (!error && data) navigate(`/admin/collection/${(data as Collection).id}`);
  };

  const duplicate = async (c: Collection) => {
    setBusy(`dup-${c.id}`);
    const { id, created_at, updated_at, ...rest } = c;
    const { data } = await supabase
      .from('collections')
      .insert({
        ...rest, name: `${c.name} (Copy)`, slug: `${c.slug}-copy-${Date.now().toString(36)}`,
        display_order: (items[items.length - 1]?.display_order ?? 0) + 1, published: false,
      })
      .select().single();
    setBusy(null);
    if (data) await load();
  };

  const remove = async (c: Collection) => {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    setBusy(`del-${c.id}`);
    await supabase.from('collections').delete().eq('id', c.id);
    setBusy(null);
    await load();
  };

  const togglePublish = async (c: Collection) => {
    setBusy(`pub-${c.id}`);
    await supabase.from('collections').update({ published: !c.published, updated_at: new Date().toISOString() }).eq('id', c.id);
    setBusy(null);
    await load();
  };

  const move = async (c: Collection, dir: -1 | 1) => {
    const idx = items.findIndex((x) => x.id === c.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const a = items[idx], b = items[swapIdx];
    setBusy(`move-${a.id}`);
    await Promise.all([
      supabase.from('collections').update({ display_order: b.display_order }).eq('id', a.id),
      supabase.from('collections').update({ display_order: a.display_order }).eq('id', b.id),
    ]);
    setBusy(null);
    await load();
  };

  return (
    <AdminLayout active="/admin/collections">
      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-[2rem] font-light text-primary">Collections</h1>
            <p className="mt-1 font-sans text-[13px] text-ink/45">Create, edit, and manage your collections.</p>
          </div>
          <Button onClick={create} disabled={busy === 'new'}>
            {busy === 'new' ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} strokeWidth={1.5} />}
            New Collection
          </Button>
        </div>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="py-20 text-center text-ink/40">Loading…</div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-ink/40">No collections yet. Create your first.</div>
          ) : (
            items.map((c, i) => (
              <div key={c.id} className="card flex flex-col gap-4 p-5 md:flex-row md:items-center md:gap-6">
                <div className="w-full md:w-24 shrink-0">
                  <ImageBlock src={c.cover_image} alt={c.name} ratio="4/5" className="!rounded-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-[1.35rem] font-light text-primary">{c.name}</h3>
                    <Badge tone={statusTone[c.availability_status]}>{statusLabel[c.availability_status]}</Badge>
                    {c.published ? <Badge tone="success">Published</Badge> : <Badge tone="warning">Hidden</Badge>}
                  </div>
                  <p className="mt-1 truncate font-sans text-[13px] font-light text-ink/50">
                    /{c.slug} · {c.remaining_stock}/{c.max_stock} remaining
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <IconBtn title="Move up" onClick={() => move(c, -1)} disabled={busy === `move-${c.id}` || i === 0}><ArrowUp size={15} strokeWidth={1.5} /></IconBtn>
                  <IconBtn title="Move down" onClick={() => move(c, 1)} disabled={busy === `move-${c.id}` || i === items.length - 1}><ArrowDown size={15} strokeWidth={1.5} /></IconBtn>
                  <IconBtn title={c.published ? 'Hide' : 'Publish'} onClick={() => togglePublish(c)} disabled={busy === `pub-${c.id}`}>
                    {c.published ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                  </IconBtn>
                  <IconBtn title="Duplicate" onClick={() => duplicate(c)} disabled={busy === `dup-${c.id}`}><Copy size={15} strokeWidth={1.5} /></IconBtn>
                  <IconBtn title="Edit" onClick={() => navigate(`/admin/collection/${c.id}`)}><Pencil size={15} strokeWidth={1.5} /></IconBtn>
                  <IconBtn title="Delete" onClick={() => remove(c)} disabled={busy === `del-${c.id}`} danger><Trash2 size={15} strokeWidth={1.5} /></IconBtn>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function IconBtn({ children, onClick, disabled, title, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; title: string; danger?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-line transition-colors duration-200 disabled:opacity-40 ${
        danger ? 'text-error hover:bg-error/10 hover:border-error/30' : 'text-ink/60 hover:bg-bg-200 hover:text-primary'
      }`}>
      {children}
    </button>
  );
}
