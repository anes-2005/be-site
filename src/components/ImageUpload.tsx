import { useRef, useState, type DragEvent } from 'react';
import { ImageBlock } from './ImageBlock';
import { uploadImage, deleteImage, pathFromUrl } from '@/lib/storage';
import { Loader2, Upload, RefreshCw, Trash2, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  ratio?: string;
  // Compact mode: smaller preview, inline layout
  compact?: boolean;
  hint?: string;
}

type Status = 'idle' | 'uploading' | 'error';

export function ImageUpload({
  label,
  value,
  onChange,
  ratio = '4/5',
  compact = false,
  hint,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');
    try {
      const { url } = await uploadImage(file);
      // Delete the previously stored image (if any) to keep storage tidy.
      if (value) {
        const oldPath = pathFromUrl(value);
        if (oldPath) await deleteImage(oldPath).catch(() => {});
      }
      onChange(url);
      setStatus('idle');
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Upload failed');
    }
  };

  const handleReplace = () => inputRef.current?.click();

  const handleDelete = async () => {
    if (!value) return;
    const oldPath = pathFromUrl(value);
    if (oldPath) await deleteImage(oldPath).catch(() => {});
    onChange(null);
    setStatus('idle');
    setErrorMsg('');
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };
  const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const previewSize = compact ? 'w-20' : 'w-32';

  return (
    <div>
      <label className="field-label">{label}</label>
      <div className={`flex gap-4 ${compact ? 'items-center' : 'items-start'}`}>
        {/* Preview / dropzone */}
        <div
          onClick={() => !value && inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`${previewSize} shrink-0 cursor-pointer transition-all ${
            dragOver ? 'ring-2 ring-primary ring-offset-2' : ''
          }`}
        >
          <ImageBlock src={value} alt={label} ratio={ratio} className="!rounded-xl" />
        </div>

        {/* Controls */}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {status === 'uploading' ? (
            <div className="flex items-center gap-2 font-sans text-[12px] text-ink/50">
              <Loader2 size={14} className="animate-spin" /> Uploading…
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReplace}
                className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 font-sans text-[11px] uppercase tracking-[0.16em] text-ink/70 transition-colors hover:border-primary/40 hover:text-primary"
              >
                {value ? <RefreshCw size={13} strokeWidth={1.5} /> : <Upload size={13} strokeWidth={1.5} />}
                {value ? 'Replace' : 'Upload'}
              </button>
              {value && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 font-sans text-[11px] uppercase tracking-[0.16em] text-ink/60 transition-colors hover:border-error/30 hover:text-error"
                >
                  <Trash2 size={13} strokeWidth={1.5} /> Remove
                </button>
              )}
            </div>
          )}

          <p className="mt-2 font-sans text-[11px] text-ink/40">
            {hint ?? 'Drag & drop or click. JPG, PNG, WEBP, SVG. Auto-optimized.'}
          </p>

          {status === 'error' && (
            <div className="mt-2 flex items-center gap-1.5 font-sans text-[11px] text-error">
              <AlertCircle size={12} strokeWidth={1.5} /> {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
