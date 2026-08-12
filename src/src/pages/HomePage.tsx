import { useEffect, useState } from 'react';
import { supabase, type Collection } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { navigate } from '@/lib/router';
import { FadeIn } from '@/components/FadeIn';
import { SectionHeader } from '@/components/SectionHeader';
import { IdeaForm } from '@/components/IdeaForm';
import { CollectionShowcaseCarousel } from '@/components/CollectionShowcaseCarousel';
import { Button } from '@/components/Button';
import { ArrowDown } from 'lucide-react';

export function HomePage() {
  const { settings } = useSettings();
  const { t, lang } = useLang();
  const [collection, setCollection] = useState<Collection | null>(null);

  useSeo({
    title: lang === 'ar' && settings.seo_title_ar ? settings.seo_title_ar : settings.seo_title,
    description: lang === 'ar' && settings.seo_description_ar ? settings.seo_description_ar : settings.seo_description,
    ogImage: settings.og_image || settings.hero_image || undefined,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('collections')
        .select('*')
        .order('display_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (active) {
        setCollection(data as Collection | null);
      }
    })();
    return () => { active = false; };
  }, []);

  const c = collection;
  const soldOut = c ? c.remaining_stock <= 0 : false;

  return (
    <main>
      {/* SECTION 1 — HERO */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden">
        <div className="absolute inset-0">
          {settings.hero_image ? (
            <img src={settings.hero_image} alt={settings.brand_name} className="h-full w-full object-cover" fetchPriority="high" />
          ) : (
            <div className="h-full w-full bg-primary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/20 to-primary/30" />
        </div>

        <div className="relative shell w-full pb-20 pt-32 md:pb-28 md:pt-40">
          <FadeIn>
            <p className="eyebrow mb-6 text-bg/70">{settings.brand_name} — {collectionName(c, lang)}</p>
            <h1
              className="font-serif font-light text-bg text-balance"
              style={{ fontSize: 'clamp(3rem, 9vw, 8rem)', lineHeight: 1.0, letterSpacing: '-0.02em' }}
            >
              {lang === 'ar' && settings.hero_headline_ar ? settings.hero_headline_ar : settings.hero_headline}
            </h1>
            <p className="mt-8 max-w-xl font-sans text-[15px] font-light leading-relaxed text-bg/75">
              {lang === 'ar' && settings.hero_subheadline_ar ? settings.hero_subheadline_ar : settings.hero_subheadline}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              {soldOut ? (
                <Button disabled size="lg" className="bg-bg/15 text-bg border border-bg/30">
                  {t('hero.soldOut')}
                </Button>
              ) : (
                <Button size="lg" onClick={() => navigate('/store')}>
                  {lang === 'ar' && settings.hero_primary_cta_ar ? settings.hero_primary_cta_ar : settings.hero_primary_cta}
                </Button>
              )}
              <span className="font-sans text-[12px] font-light text-bg/60">
                {lang === 'ar' && settings.hero_secondary_note_ar ? settings.hero_secondary_note_ar : settings.hero_secondary_note}
              </span>
            </div>
          </FadeIn>
        </div>

        <button
          onClick={() => document.getElementById('idea')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-bg/50 transition-colors hover:text-bg"
          aria-label="Scroll down"
        >
          <ArrowDown size={18} strokeWidth={1.4} className="animate-bounce" />
        </button>
      </section>

      {/* SECTION 2 — GIVE US YOUR IDEAS */}
      <section id="idea" className="shell py-30 md:py-38">
        <SectionHeader
          eyebrow={t('idea.eyebrow')}
          title={t('idea.title')}
        />
        <div className="mx-auto mt-16 max-w-3xl">
          <IdeaForm />
        </div>
      </section>

      {/* SECTION 3 — WHY PREORDER (materials / quality) */}
      <section className="bg-bg-100 py-30 md:py-38">
        <div className="content">
          <SectionHeader
            eyebrow={t('whyPreorder.eyebrow')}
            title={t('whyPreorder.title')}
            description={t('whyPreorder.description')}
          />
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {(settings.why_preorder ?? []).map((card, i) => {
              const key = `whyPreorder.card${i + 1}`;
              return (
              <FadeIn key={i} delay={i * 100}>
                <div className="card h-full p-10">
                  <span className="font-serif text-[2.5rem] font-light text-secondary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-6 font-serif text-[1.5rem] font-light leading-tight text-primary">
                    {lang === 'ar' ? t(`${key}.title`) : card.title}
                  </h3>
                  <p className="mt-4 font-sans text-[14px] font-light leading-relaxed text-ink/55">
                    {lang === 'ar' ? t(`${key}.body`) : card.body}
                  </p>
                </div>
              </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4 — EXPLORE COLLECTIONS (rotating showcase, links to /store) */}
      <section className="shell py-30 md:py-38">
        <SectionHeader
          eyebrow={t('explore.eyebrow')}
          title={t('explore.title')}
          description={t('explore.description')}
        />
        <div className="mt-16">
          <CollectionShowcaseCarousel />
        </div>
      </section>
    </main>
  );
}

function collectionName(c: Collection | null, lang: string): string {
  if (!c) return 'The Debut';
  if (lang === 'ar' && (c as Collection & { name_ar?: string }).name_ar) {
    return (c as Collection & { name_ar?: string }).name_ar!;
  }
  return c.name;
}

