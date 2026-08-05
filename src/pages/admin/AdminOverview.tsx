import { useEffect, useState } from 'react';
import { supabase, type Collection, type Preorder } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';
import { AdminLayout } from './AdminLayout';
import { useSeo } from '@/lib/seo';
import { navigate } from '@/lib/router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ImageBlock } from '@/components/ImageBlock';
import { Layers, ClipboardList, TrendingUp, Package, Plus, ArrowRight, Eye, EyeOff, Image, BarChart3, Mail } from 'lucide-react';

export function AdminOverview() {
  useSeo({ title: 'be — Admin Overview', description: 'Dashboard' });
  const { settings, reload } = useSettings();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('collections').select('*').order('display_order', { ascending: true }),
        supabase.from('preorders').select('*').order('created_at', { ascending: false }),
      ]);
      if (active) {
        setCollections((c as Collection[]) ?? []);
        setPreorders((p as Preorder[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const totalStock = collections.reduce((s, c) => s + c.remaining_stock, 0);
  const maxStock = collections.reduce((s, c) => s + c.max_stock, 0);
  const reserved = maxStock - totalStock;
  const recentPreorders = preorders.slice(0, 5);

  const toggleSite = async () => {
    await supabase.from('site_settings').update({ site_online: !settings.site_online, updated_at: new Date().toISOString() }).eq('id', 1);
    reload();
  };

  return (
    <AdminLayout active="/admin">
      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-[2rem] font-light text-primary">Overview</h1>
            <p className="mt-1 font-sans text-[13px] text-ink/45">Manage everything on your site.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={toggleSite}
            >
              {settings.site_online ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
              {settings.site_online ? 'Take Offline' : 'Publish Site'}
            </Button>
            <Button onClick={() => navigate('/admin/collections')}>
              <Plus size={15} strokeWidth={1.5} /> New Collection
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Layers} label="Collections" value={loading ? '—' : String(collections.length)} />
          <StatCard icon={ClipboardList} label="Preorders" value={loading ? '—' : String(preorders.length)} />
          <StatCard icon={Package} label="Pieces Reserved" value={loading ? '—' : String(reserved)} />
          <StatCard icon={TrendingUp} label="Pieces Remaining" value={loading ? '—' : String(totalStock)} />
        </div>

        {/* Quick links to new sections */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickLink icon={Image} label="Media Library" desc="All uploaded images" to="/admin/media" />
          <QuickLink icon={BarChart3} label="Analytics" desc="Sales & preorder insights" to="/admin/analytics" />
          <QuickLink icon={Mail} label="Google" desc="Sheets & Gmail integration" to="/admin/google" />
        </div>

        {/* Two columns */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent preorders */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-[11px] uppercase tracking-[0.24em] text-ink/60">Recent Preorders</h2>
              <button onClick={() => navigate('/admin/preorders')} className="flex items-center gap-1 font-sans text-[11px] uppercase tracking-[0.16em] text-primary hover:underline">
                View all <ArrowRight size={12} strokeWidth={1.5} />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {recentPreorders.length === 0 ? (
                <p className="py-6 text-center font-sans text-[13px] text-ink/40">No preorders yet.</p>
              ) : (
                recentPreorders.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border-b border-line/60 pb-3 last:border-0">
                    <div>
                      <p className="font-sans text-[13px] font-medium text-primary">{r.full_name}</p>
                      <p className="font-sans text-[11px] text-ink/40">{r.size} · Qty {r.quantity} · {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge tone={r.status === 'confirmed' ? 'success' : r.status === 'cancelled' ? 'error' : 'warning'}>
                      {r.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Collections summary */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-[11px] uppercase tracking-[0.24em] text-ink/60">Collections</h2>
              <button onClick={() => navigate('/admin/collections')} className="flex items-center gap-1 font-sans text-[11px] uppercase tracking-[0.16em] text-primary hover:underline">
                Manage <ArrowRight size={12} strokeWidth={1.5} />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {collections.length === 0 ? (
                <p className="py-6 text-center font-sans text-[13px] text-ink/40">No collections yet.</p>
              ) : (
                collections.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/admin/collection/${c.id}`)}
                    className="flex w-full items-center gap-4 border-b border-line/60 pb-3 text-left last:border-0 transition-colors hover:bg-bg-200/40"
                  >
                    <div className="w-12 shrink-0">
                      <ImageBlock src={c.cover_image} alt={c.name} ratio="4/5" className="!rounded-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-[13px] font-medium text-primary">{c.name}</p>
                      <p className="font-sans text-[11px] text-ink/40">{c.remaining_stock}/{c.max_stock} remaining</p>
                    </div>
                    {c.published ? <Badge tone="success">Live</Badge> : <Badge tone="warning">Hidden</Badge>}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function QuickLink({ icon: Icon, label, desc, to }: { icon: typeof Layers; label: string; desc: string; to: string }) {
  return (
    <button
      onClick={() => navigate(to)}
      className="card group flex items-center gap-4 p-5 text-left transition-all hover:border-primary/30"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary/10">
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.16em] text-primary">{label}</p>
        <p className="mt-0.5 font-sans text-[11px] text-ink/45">{desc}</p>
      </div>
      <ArrowRight size={15} strokeWidth={1.5} className="shrink-0 text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Layers; label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
          <Icon size={18} strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink/40">{label}</p>
          <p className="font-serif text-[1.75rem] font-light leading-tight text-primary">{value}</p>
        </div>
      </div>
    </div>
  );
}
