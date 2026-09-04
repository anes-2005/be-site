import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from './AdminLayout';
import { useSeo } from '@/lib/seo';
import { Search, Trash2, Mail } from 'lucide-react';

interface CollectionIdea {
  id: string;
  name: string;
  contact: string | null;
  message: string;
  status: 'new' | 'reviewed' | 'archived';
  created_at: string;
}

const statusStyles: Record<CollectionIdea['status'], string> = {
  new: 'bg-warning/10 text-warning',
  reviewed: 'bg-success/10 text-success',
  archived: 'bg-ink/10 text-ink/50',
};

export function AdminIdeasPage() {
  useSeo({ title: 'be — Collection Ideas', description: 'Visitor suggestions for future collections.' });
  const [rows, setRows] = useState<CollectionIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('collection_ideas')
        .select('*')
        .order('created_at', { ascending: false });
      if (active) {
        setRows((data as CollectionIdea[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = rows.filter((r) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.contact ?? '').toLowerCase().includes(q) ||
      r.message.toLowerCase().includes(q)
    );
  });

  const setStatus = async (r: CollectionIdea, status: CollectionIdea['status']) => {
    await supabase.from('collection_ideas').update({ status }).eq('id', r.id);
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)));
  };

  const deleteIdea = async (r: CollectionIdea) => {
    const confirmed = window.confirm(`Delete the idea from "${r.name}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeletingId(r.id);
    const { error } = await supabase.from('collection_ideas').delete().eq('id', r.id);
    setDeletingId(null);
    if (error) {
      window.alert('Failed to delete idea: ' + error.message);
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== r.id));
  };

  return (
    <AdminLayout active="/admin/ideas">
      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-[2rem] font-light text-primary">Collection Ideas</h1>
            <p className="mt-1 font-sans text-[13px] text-ink/45">{rows.length} suggestions from visitors.</p>
          </div>
          <div className="relative">
            <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              className="field-input !w-72 !pl-10"
              placeholder="Search name, contact, message…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-ink/40">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-ink/40">No ideas submitted yet.</div>
        ) : (
          <div className="mt-8 space-y-4">
            {filtered.map((r) => (
              <div key={r.id} className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-[1.1rem] font-light text-primary">{r.name}</span>
                      <span className={`rounded-md px-2 py-0.5 font-sans text-[10px] uppercase tracking-[0.1em] ${statusStyles[r.status]}`}>
                        {r.status}
                      </span>
                    </div>
                    {r.contact && (
                      <div className="mt-1 flex items-center gap-1.5 font-sans text-[12px] text-ink/50">
                        <Mail size={12} strokeWidth={1.5} />
                        {r.contact}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={r.status}
                      onChange={(e) => setStatus(r, e.target.value as CollectionIdea['status'])}
                      className="rounded-lg border border-line bg-bg-50 px-2 py-1 text-[11px] uppercase tracking-[0.1em] focus:border-primary focus:outline-none"
                    >
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="archived">Archived</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => deleteIdea(r)}
                      disabled={deletingId === r.id}
                      title="Delete idea"
                      className="inline-flex items-center justify-center rounded-lg border border-error/20 p-2 text-error/70 transition-colors hover:border-error hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-ink/70">{r.message}</p>
                <p className="mt-3 font-sans text-[11px] text-ink/35">{new Date(r.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
