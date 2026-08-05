import { useEffect, useState } from 'react';
import { supabase, type Collection, type Preorder } from '@/lib/supabase';
import { AdminLayout } from './AdminLayout';
import { useSeo } from '@/lib/seo';
import { formatPrice } from '@/components/PriceTag';
import { Layers, ClipboardList, Package, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';

interface PreorderWithCollection extends Preorder {
  collections: Pick<Collection, 'name' | 'current_price' | 'currency'> | null;
}

export function AdminAnalyticsDashboard() {
  useSeo({ title: 'be — Analytics', description: 'Sales and preorder insights.' });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [preorders, setPreorders] = useState<PreorderWithCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('collections').select('*').order('display_order', { ascending: true }),
        supabase
          .from('preorders')
          .select('*, collections(name, current_price, currency)')
          .order('created_at', { ascending: false }),
      ]);
      if (active) {
        setCollections((c as Collection[]) ?? []);
        setPreorders((p as PreorderWithCollection[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const totalStock = collections.reduce((s, c) => s + c.remaining_stock, 0);
  const maxStock = collections.reduce((s, c) => s + c.max_stock, 0);
  const reserved = maxStock - totalStock;
  const confirmed = preorders.filter((p) => p.status === 'confirmed');
  const cancelled = preorders.filter((p) => p.status === 'cancelled');
  const received = preorders.filter((p) => p.status === 'received');

  // Estimated revenue from confirmed preorders
  const revenue = confirmed.reduce((sum, p) => {
    const price = p.collections?.current_price ?? 0;
    return sum + (price ?? 0) * p.quantity;
  }, 0);
  const currency = collections[0]?.currency ?? 'DZD';

  // Last 7 days preorder counts
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const dailyCounts = days.map((d) => {
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return preorders.filter((p) => {
      const t = new Date(p.created_at);
      return t >= d && t < next;
    }).length;
  });
  const maxDaily = Math.max(1, ...dailyCounts);

  // Top collections by preorders
  const byCollection = collections
    .map((c) => ({
      name: c.name,
      count: preorders.filter((p) => p.collection_id === c.id).length,
      remaining: c.remaining_stock,
      max: c.max_stock,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <AdminLayout active="/admin/analytics">
      <div className="px-6 py-8 md:px-10 md:py-10">
        <div>
          <h1 className="font-serif text-[2rem] font-light text-primary">Analytics</h1>
          <p className="mt-1 font-sans text-[13px] text-ink/45">Sales insights and preorder trends.</p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-ink/40">Loading…</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
              <Stat icon={Layers} label="Collections" value={String(collections.length)} />
              <Stat icon={ClipboardList} label="Preorders" value={String(preorders.length)} />
              <Stat icon={Package} label="Reserved" value={String(reserved)} />
              <Stat icon={TrendingUp} label="Remaining" value={String(totalStock)} />
              <Stat icon={ShoppingBag} label="Confirmed" value={String(confirmed.length)} />
              <Stat icon={DollarSign} label="Est. Revenue" value={formatPrice(revenue, currency) ?? '—'} />
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 7-day chart */}
              <div className="card p-6">
                <h2 className="font-sans text-[11px] uppercase tracking-[0.24em] text-ink/60">Preorders — Last 7 Days</h2>
                <div className="mt-8 flex h-40 items-end justify-between gap-2">
                  {dailyCounts.map((count, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-md bg-primary/80 transition-all duration-700 ease-out-soft"
                        style={{ height: `${(count / maxDaily) * 100}%`, minHeight: count > 0 ? '8px' : '2px' }}
                        title={`${count} preorders`}
                      />
                      <span className="font-sans text-[10px] uppercase tracking-[0.1em] text-ink/40">
                        {days[i].toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status breakdown */}
              <div className="card p-6">
                <h2 className="font-sans text-[11px] uppercase tracking-[0.24em] text-ink/60">Status Breakdown</h2>
                <div className="mt-6 space-y-4">
                  <StatusRow label="Received" count={received.length} total={preorders.length} tone="bg-warning" />
                  <StatusRow label="Confirmed" count={confirmed.length} total={preorders.length} tone="bg-success" />
                  <StatusRow label="Cancelled" count={cancelled.length} total={preorders.length} tone="bg-error" />
                </div>
              </div>
            </div>

            {/* Top collections */}
            <div className="mt-6 card p-6">
              <h2 className="font-sans text-[11px] uppercase tracking-[0.24em] text-ink/60">Top Collections by Preorders</h2>
              <div className="mt-6 space-y-4">
                {byCollection.length === 0 ? (
                  <p className="py-6 text-center font-sans text-[13px] text-ink/40">No preorders yet.</p>
                ) : (
                  byCollection.map((c) => (
                    <div key={c.name}>
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-[13px] font-medium text-primary">{c.name}</span>
                        <span className="font-sans text-[12px] text-ink/50">{c.count} preorders · {c.remaining}/{c.max} left</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-300">
                        <div
                          className="h-full rounded-full bg-secondary transition-all duration-700 ease-out-soft"
                          style={{ width: `${c.max > 0 ? ((c.max - c.remaining) / c.max) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Layers; label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
          <Icon size={18} strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink/40">{label}</p>
          <p className="font-serif text-[1.5rem] font-light leading-tight text-primary">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, count, total, tone }: { label: string; count: number; total: number; tone: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-sans text-[13px] text-ink/70">{label}</span>
        <span className="font-sans text-[12px] text-ink/50">{count} ({Math.round(pct)}%)</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-300">
        <div className={`h-full rounded-full ${tone} transition-all duration-700 ease-out-soft`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
