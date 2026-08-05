import { useEffect, useState } from 'react';
import { supabase, type Preorder, type Collection } from '@/lib/supabase';
import { AdminLayout } from './AdminLayout';
import { useSeo } from '@/lib/seo';
import { Badge } from '@/components/Badge';
import { Search, Trash2 } from 'lucide-react';

type PreorderWithCollection = Preorder & { collections: Pick<Collection, 'name' | 'slug'> | null };

const statusTone = {
  received: 'warning',
  confirmed: 'success',
  cancelled: 'error',
} as const;

export function AdminPreordersPage() {
  useSeo({ title: 'be — Preorders', description: 'View preorder submissions.' });
  const [rows, setRows] = useState<PreorderWithCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('preorders')
        .select('*, collections(name, slug)')
        .order('created_at', { ascending: false });
      if (active) {
        setRows((data as PreorderWithCollection[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = rows.filter((r) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      r.wilaya.toLowerCase().includes(q) ||
      (r.collections?.name ?? '').toLowerCase().includes(q)
    );
  });

  const setStatus = async (r: Preorder, status: Preorder['status']) => {
    await supabase.from('preorders').update({ status }).eq('id', r.id);
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)));
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deletePreorder = async (r: PreorderWithCollection) => {
    const confirmed = window.confirm(
      `Delete the preorder from "${r.full_name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    setDeletingId(r.id);
    const { error } = await supabase.from('preorders').delete().eq('id', r.id);
    setDeletingId(null);
    if (error) {
      window.alert('Failed to delete preorder: ' + error.message);
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== r.id));
  };

  return (
    <AdminLayout active="/admin/preorders">
      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-[2rem] font-light text-primary">Preorders</h1>
            <p className="mt-1 font-sans text-[13px] text-ink/45">{rows.length} total submissions.</p>
          </div>
          <div className="relative">
            <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              className="field-input !w-72 !pl-10"
              placeholder="Search name, email, wilaya…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-ink/40">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-ink/40">No preorders yet.</div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-line">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-bg-200">
                  <tr className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink/50">
                    <th className="px-5 py-4 font-medium">Name</th>
                    <th className="px-5 py-4 font-medium">Contact</th>
                    <th className="px-5 py-4 font-medium">Delivery</th>
                    <th className="px-5 py-4 font-medium">Wilaya</th>
                    <th className="px-5 py-4 font-medium">Municipality</th>
                    <th className="px-5 py-4 font-medium">Collection</th>
                    <th className="px-5 py-4 font-medium">Size</th>
                    <th className="px-5 py-4 font-medium">Qty</th>
                    <th className="px-5 py-4 font-medium">Date</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-bg-50">
                  {filtered.map((r) => (
                    <tr key={r.id} className="font-sans text-[13px] text-ink/70 transition-colors hover:bg-bg-200/60">
                      <td className="px-5 py-4 font-medium text-primary">{r.full_name}</td>
                      <td className="px-5 py-4">
                        <div className="text-ink/70">{r.email}</div>
                        <div className="text-ink/40">{r.phone}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-md px-2 py-0.5 font-sans text-[10px] uppercase tracking-[0.1em] ${r.delivery_method === 'office_pickup' ? 'bg-secondary/10 text-secondary' : 'bg-primary/5 text-primary'}`}>
                          {r.delivery_method === 'office_pickup' ? 'Pickup' : 'Home'}
                        </span>
                      </td>
                      <td className="px-5 py-4">{r.wilaya}</td>
                      <td className="px-5 py-4 text-ink/50">{r.municipality ?? '—'}</td>
                      <td className="px-5 py-4">{r.collections?.name ?? '—'}</td>
                      <td className="px-5 py-4">{r.size}</td>
                      <td className="px-5 py-4">{r.quantity}</td>
                      <td className="px-5 py-4 text-ink/50">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <select
                          value={r.status}
                          onChange={(e) => setStatus(r, e.target.value as Preorder['status'])}
                          className="rounded-lg border border-line bg-bg-50 px-2 py-1 text-[11px] uppercase tracking-[0.1em] focus:border-primary focus:outline-none"
                        >
                          <option value="received">Received</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => deletePreorder(r)}
                          disabled={deletingId === r.id}
                          title="Delete preorder"
                          className="inline-flex items-center justify-center rounded-lg border border-error/20 p-2 text-error/70 transition-colors hover:border-error hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
