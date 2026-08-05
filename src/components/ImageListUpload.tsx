import { useRef, useState, type DragEvent } from 'react';
import { ImageBlock } from './ImageBlock';
import { uploadImage, deleteImage, pathFromUrl } from '@/lib/storage';
import { Loader2, Upload, Trash2, GripVertical, AlertCircle, Plus } from 'lucide-react';

interface ImageListUploadProps {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  min?: number;
  ratio?: string;
  hint?: string;
}

export function ImageListUpload({
  label,
  values,
  onChange,
  min = 0,
  ratio = '3/4',
  hint,
}: ImageListUploadProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const appendRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<number | 'append' | null>(null);
  const [error, setError] = useState('');

  const list = values.length >= min ? values : [...values, ...Array.from({ length: min - values.length }, () => '')];

  const uploadTo = async (i: number, file: File) => {
    setBusy(i);
    setError('');
    try {
      const { url } = await uploadImage(file);
      const next = [...list];
      const prev = next[i];
      next[i] = url;
      if (prev) { const p = pathFromUrl(prev); if (p) await deleteImage(p).catch(() => {}); }
      onChange(next.filter((x) => x !== ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(null);
    }
  };

  const append = async (file: File) => {
    setBusy('append');
    setError('');
    try {
      const { url } = await uploadImage(file);
      onChange([...values, url]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (i: number) => {
    const cur = list[i];
    if (!cur) return;
    const p = pathFromUrl(cur);
    if (p) await deleteImage(p).catch(() => {});
    const next = list.filter((_, idx) => idx !== i);
    onChange(next.filter((x) => x !== ''));
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next.filter((x) => x !== ''));
  };

  const onDrop = (i: number, e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadTo(i, file);
  };

  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="space-y-3">
        {list.map((src, i) => (
          <div key={i} className="flex items-center gap-3">
            <button type="button" onClick={() => move(i, -1)} className="text-ink/30 hover:text-primary" aria-label="Move up">
              <GripVertical size={14} />
            </button>
            <div
              className="w-16 shrink-0 cursor-pointer"
              onClick={() => inputRefs.current[i]?.click()}
              onDrop={(e) => onDrop(i, e)}
              onDragOver={(e) => e.preventDefault()}
            >
              <ImageBlock src={src || null} alt={`${label} ${i + 1}`} ratio={ratio} className="!rounded-lg" />
            </div>
            <input
              ref={(el) => { inputRefs.current[i] = el; }}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadTo(i, f); }}
            />
            <div className="flex-1">
              {busy === i ? (
                <span className="flex items-center gap-2 font-sans text-[11px] text-ink/50">
                  <Loader2 size={13} className="animate-spin" /> Uploading…
                </span>
              ) : src ? (
                <button
                  type="button"
                  onClick={() => inputRefs.current[i]?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 font-sans text-[10px] uppercase tracking-[0.14em] text-ink/60 hover:border-primary/40 hover:text-primary"
                >
                  <Upload size={11} strokeWidth={1.5} /> Replace
                </button>
              ) : (
                <span className="font-sans text-[11px] text-ink/40">Drop or click to upload</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink/50 hover:border-error/30 hover:text-error"
              aria-label="Remove"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      <input
        ref={appendRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) append(f); }}
      />
      <button
        type="button"
        onClick={() => appendRef.current?.click()}
        className="mt-3 inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.18em] text-primary hover:underline"
      >
        {busy === 'append' ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} strokeWidth={1.5} />}
        Add image
      </button>

      {hint && <p className="mt-2 font-sans text-[11px] text-ink/40">{hint}</p>}
      {error && (
        <div className="mt-2 flex items-center gap-1.5 font-sans text-[11px] text-error">
          <AlertCircle size={12} strokeWidth={1.5} /> {error}
        </div>
      )}
    </div>
  );
}
