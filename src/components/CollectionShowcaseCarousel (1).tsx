import { useEffect, useState } from 'react';
import { supabase, type Collection } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';
import { useLang } from '@/lib/i18n';
import { navigate } from '@/lib/router';
import { Button } from './Button';

// Rotating cover-word colors, cycled per card (gold / cream-white / soft blue).
const WORD_COLORS = ['text-secondary-300', 'text-bg-50', 'text-primary-200'];

export function CollectionShowcaseCarousel() {
  const { t } = useLang();
  const { settings } = useSettings();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true })
        .limit(3);
      if (active) {
        setCollections((data as Collection[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const brandPrefix = (settings.brand_name || 'be').toUpperCase();

  const coverWord = (name: string) => {
    const trimmed = name.trim();
    const lower = trimmed.toLowerCase();
    const prefixLower = brandPrefix.toLowerCase();
    if (lower.startsWith(prefixLower + ' ')) {
      return trimmed.slice(brandPrefix.length).trim().toUpperCase();
    }
    return trimmed.toUpperCase();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-pulse rounded-full bg-line" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center gap-5 md:flex-row md:items-end md:gap-4">
        {collections.map((c, i) => {
          const isMiddle = collections.length === 3 && i === 1;
          const img = c.cover_image || c.preview_images?.[0] || '';
          return (
            <div
              key={c.id}
              className={`relative w-full max-w-[300px] overflow-hidden rounded-3xl border border-line shadow-card transition-transform duration-500 ${
                isMiddle ? 'md:z-10 md:max-w-[340px] md:-translate-y-4' : 'md:max-w-[280px]'
              }`}
              style={{ aspectRatio: isMiddle ? '3 / 4.3' : '3 / 4' }}
            >
              {img ? (
                <img src={img} alt={c.name} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-primary" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/55 via-primary/5 to-primary/10" />

              <div className="relative flex h-full flex-col p-6 md:p-7">
                <span className="font-serif text-[1.1rem] font-light text-bg/90">{brandPrefix}</span>
                <span
                  className={`mt-0.5 font-serif font-light leading-[0.95] ${WORD_COLORS[i % WORD_COLORS.length]}`}
                  style={{ fontSize: 'clamp(1.9rem, 6vw, 2.6rem)' }}
                >
                  {coverWord(c.name)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-14 flex justify-center">
        <Button size="lg" onClick={() => navigate('/store')}>
          {t('explore.button')}
        </Button>
      </div>
    </div>
  );
}
