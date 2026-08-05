interface ImageBlockProps {
  src: string | null | undefined;
  alt: string;
  ratio?: string; // e.g. '3/4', '4/5', '16/9'
  className?: string;
  zoom?: boolean;
  // placeholder tone
  placeholder?: 'neutral' | 'dark';
}

// Reusable image block with graceful placeholder when no image is set.
// Images are lazy-loaded and fully replaceable.
export function ImageBlock({
  src,
  alt,
  ratio = '4/5',
  className = '',
  zoom = false,
  placeholder = 'neutral',
}: ImageBlockProps) {
  const wrap = zoom ? 'img-zoom' : '';
  const tone = placeholder === 'dark' ? 'bg-primary/5' : 'bg-bg-300';

  return (
    <div className={`relative overflow-hidden rounded-2xl ${wrap} ${className}`} style={{ aspectRatio: ratio }}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className={`absolute inset-0 ${tone} flex items-center justify-center`}>
          <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink/30">
            {alt || 'Image'}
          </span>
        </div>
      )}
    </div>
  );
}
