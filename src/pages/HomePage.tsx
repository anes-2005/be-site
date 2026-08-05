import { useEffect, useState } from 'react';
import { supabase, type Collection } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { navigate } from '@/lib/router';
import { FadeIn } from '@/components/FadeIn';
import { ImageBlock } from '@/components/ImageBlock';
import { SectionHeader } from '@/components/SectionHeader';
import { StockCounter } from '@/components/StockCounter';
import { Gallery } from '@/components/Gallery';
import { PreorderForm } from '@/components/PreorderForm';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { PriceTag } from '@/components/PriceTag';
import { ArrowDown } from 'lucide-react';

export function HomePage() {
  const { settings } = useSettings();
  const { t, lang } = useLang();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useSeo({
    title: lang === 'ar' && settings.seo_title_ar ? settings.seo_title_ar : settings.seo_title,
    description: lang === 'ar' && settings.seo_description_ar ? settings.seo_description_ar : settings.seo_description,
    ogImage: collection?.og_image || settings.og_image || settings.hero_image || undefined,
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
        setLoading(false);
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
                <Button size="lg" onClick={() => document.getElementById('preorder')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
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
          onClick={() => navigate('/#collection')}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-bg/50 transition-colors hover:text-bg"
          aria-label="Scroll down"
        >
          <ArrowDown size={18} strokeWidth={1.4} className="animate-bounce" />
        </button>
      </section>

      {/* SECTION 2 — COLLECTION HEADER + THREE PREVIEW IMAGES */}
      <section id="collection" className="shell py-30 md:py-38">
        <FadeIn>
          <div className="text-center">
            <p className="eyebrow mb-6">{t('collection.eyebrow')}</p>
            <h2 className="font-serif font-light text-primary" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', letterSpacing: '-0.01em' }}>
              {collectionName(c, lang)}
            </h2>
            {c?.short_description && (
              <p className="mx-auto mt-6 max-w-xl font-sans text-[15px] font-light leading-relaxed text-ink/55">
                {collectionDesc(c, lang)}
              </p>
            )}
            {c?.current_price != null && (
              <div className="mt-6 flex justify-center">
                <PriceTag collection={c} size="lg" align="center" />
              </div>
            )}
          </div>
        </FadeIn>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {(c?.preview_images ?? ['', '', '']).map((src, i) => (
            <FadeIn key={i} delay={i * 100}>
              <ImageBlock src={src} alt={`${c?.name ?? 'Collection'} ${i + 1}`} ratio="3/4" zoom />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* SECTION 3 — WHY PREORDER */}
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

      {/* SECTION 4 — OPTIONAL COLLECTION PREVIEW GALLERY */}
      {c && c.gallery_images && c.gallery_images.length > 0 && (
        <section className="shell py-30 md:py-38">
          <SectionHeader eyebrow={t('preview.eyebrow')} title={t('preview.title')} />
          <div className="mt-16">
            <Gallery images={c.gallery_images} columns={3} />
          </div>
        </section>
      )}

      {/* SECTION 5 — REMAINING STOCK */}
      <section className="bg-primary py-30 md:py-38">
        <div className="content">
          {c ? (
            <StockCounter remaining={c.remaining_stock} max={c.max_stock} />
          ) : (
            <div className="text-center text-bg/60">{loading ? t('stock.loading') : ''}</div>
          )}
          <div className="mt-12 flex justify-center">
            {soldOut ? (
              <Badge tone="error">{t('hero.soldOut')}</Badge>
            ) : (
              <Button variant="outline" size="lg" className="border-bg/30 text-bg hover:bg-bg hover:text-primary" onClick={() => document.getElementById('preorder')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                {t('reserve.button')}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 6 — PREORDER FORM */}
      <section id="preorder" className="shell py-30 md:py-38">
        <SectionHeader
          eyebrow={t('reserve.eyebrow')}
          title={t('reserve.title')}
          description={t('reserve.description')}
        />
        <div className="mx-auto mt-16 max-w-3xl">
          {c ? (
            <PreorderForm collection={c} onSuccess={() => navigate('/confirmation')} />
          ) : (
            <div className="card p-12 text-center text-ink/50">{loading ? t('stock.loading') : ''}</div>
          )}
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

function collectionDesc(c: Collection | null, lang: string): string {
  if (!c) return '';
  if (lang === 'ar' && (c as Collection & { short_description_ar?: string }).short_description_ar) {
    return (c as Collection & { short_description_ar?: string }).short_description_ar!;
  }
  return c.short_description;
}
