import { ImageBlock } from './ImageBlock';
import { FadeIn } from './FadeIn';

interface GalleryProps {
  images: string[];
  // grid columns at desktop
  columns?: 2 | 3 | 4;
  className?: string;
}

// Optional, fully editable gallery. Renders nothing if no images are set,
// so any section using it can simply leave the array empty to "hide" it.
export function Gallery({ images, columns = 3, className = '' }: GalleryProps) {
  if (!images || images.length === 0) return null;
  const colClass =
    columns === 2 ? 'sm:grid-cols-2' : columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid grid-cols-1 gap-4 md:gap-6 ${colClass} ${className}`}>
      {images.map((src, i) => (
        <FadeIn key={i} delay={(i % 3) * 80}>
          <ImageBlock src={src} alt={`Gallery ${i + 1}`} ratio="4/5" zoom />
        </FadeIn>
      ))}
    </div>
  );
}
