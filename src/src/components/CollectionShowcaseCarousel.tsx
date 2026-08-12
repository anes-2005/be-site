import { useEffect, useState } from 'react';
import { supabase, type Collection } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import { navigate } from '@/lib/router';
import { Button } from './Button';

const ROTATE_MS = 3800;

export function CollectionShowcaseCarousel() {
  const { t } = useLang();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true });
      if (active) {
        setCollections((data as Collection[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (collections.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % collections.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [collections.length]);

  const images = collections
    .map((c) => c.cover_image || c.preview_images?.[0] || '')
    .filter(Boolean);

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-primary md:aspect-[21/9]">
        {loading || images.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-primary" />
        ) : (
          images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out"
              style={{ opacity: i === index % images.length ? 1 : 0 }}
            />
          ))
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />

        {images.length > 1 && (
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === index % images.length ? 'w-6 bg-bg' : 'w-1.5 bg-bg/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 flex justify-center">
        <Button size="lg" onClick={() => navigate('/store')}>
          {t('explore.button')}
        </Button>
      </div>
    </div>
  );
}
