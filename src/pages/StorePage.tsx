import { useEffect, useState } from 'react';
import { supabase, type Collection } from '@/lib/supabase';
import { BRAND, SITE } from '@/lib/brand';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { FadeIn } from '@/components/FadeIn';
import { SectionHeader } from '@/components/SectionHeader';
import { CollectionCard } from '@/components/CollectionCard';

export function StorePage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useSeo({
    title: `${BRAND.name} — ${t('store.eyebrow')}`,
    description: t('store.description'),
  });

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
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="pt-32">
      <section className="shell pb-20 md:pb-28">
        <FadeIn>
          <p className="eyebrow mb-6 text-center">{t('store.eyebrow')}</p>
          <h1
            className="text-center font-serif font-light text-primary text-balance"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', letterSpacing: '-0.015em' }}
          >
            {t('store.title')}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-center font-sans text-[15px] font-light leading-relaxed text-ink/55">
            {t('store.description')}
          </p>
        </FadeIn>
      </section>

      <section className="shell pb-30 md:pb-38">
        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-bg-300" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="py-20 text-center font-sans text-[15px] font-light text-ink/50">
            {t('store.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            {collections.map((c, i) => (
              <FadeIn key={c.id} delay={(i % 3) * 100}>
                <CollectionCard collection={c} />
              </FadeIn>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
