import { useEffect, useState } from 'react';
import { supabase, type Collection } from '@/lib/supabase';
import { useSeo } from '@/lib/seo';
import { useLang } from '@/lib/i18n';
import { FadeIn } from '@/components/FadeIn';
import { ImageBlock } from '@/components/ImageBlock';
import { Gallery } from '@/components/Gallery';
import { StockCounter } from '@/components/StockCounter';
import { PreorderForm } from '@/components/PreorderForm';
import { SectionHeader } from '@/components/SectionHeader';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { PriceTag } from '@/components/PriceTag';
import { navigate } from '@/lib/router';
import { ArrowLeft, Instagram } from 'lucide-react';

interface Props {
  slug: string;
}

export function CollectionPage({ slug }: Props) {
  const [c, setC] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useLang();

  useSeo({
    title: seoTitle(c, lang) || `${cName(c, lang)} — be`,
    description: seoDesc(c, lang) || c?.short_description,
    ogImage: c?.og_image || c?.cover_image || undefined,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (active) {
        setC(data as Collection | null);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="pt-32">
        <div className="shell py-30">
          <div className="aspect-[16/9] animate-pulse rounded-2xl bg-bg-300" />
        </div>
      </main>
    );
  }

  if (!c) {
    return (
      <main className="shell flex min-h-[70vh] flex-col items-center justify-center pt-32 text-center">
        <h1 className="font-serif text-[2.5rem] font-light text-primary">{t('collectionPage.notFound')}</h1>
        <Button variant="outline" className="mt-8" onClick={() => navigate('/store')}>
          {t('collectionPage.notFoundButton')}
        </Button>
      </main>
    );
  }

  const soldOut = c.remaining_stock <= 0 || c.availability_status === 'sold_out';

  // Null/NaN safety for stock values — never pass undefined to the counter.
  const safeRemaining = Number.isFinite(c.remaining_stock) ? c.remaining_stock : 0;
  const safeMax = Number.isFinite(c.max_stock) && c.max_stock > 0 ? c.max_stock : 100;

  return (
    <main className="pt-20">
      {/* HERO */}
      <section className="relative flex min-h-[80svh] items-end overflow-hidden">
        <div className="absolute inset-0">
          {c.cover_image ? (
            <img src={c.cover_image} alt={c.name} className="h-full w-full object-cover" fetchPriority="high" />
          ) : (
            <div className="h-full w-full bg-primary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/20 to-primary/30" />
        </div>
        <div className="relative shell w-full pb-16 pt-32 md:pb-24">
          <FadeIn>
            <button
              onClick={() => navigate('/store')}
              className="mb-8 inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.22em] text-bg/70 transition-colors hover:text-bg"
            >
              <ArrowLeft size={14} strokeWidth={1.5} /> {t('collectionPage.back')}
            </button>
            <p className="eyebrow mb-5 text-bg/70">{t('collectionPage.eyebrow')}</p>
            <h1
              className="font-serif font-light text-bg text-balance"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)', letterSpacing: '-0.015em' }}
            >
              {cName(c, lang)}
            </h1>
            <p className="mt-6 max-w-xl font-sans text-[15px] font-light leading-relaxed text-bg/75">
              {cDesc(c, lang)}
            </p>
            {c.current_price != null && (
              <div className="mt-6">
                <PriceTag collection={c} size="lg" className="[&_span]:!text-bg [&_span.line-through]:!text-bg/50" />
              </div>
            )}
            {!soldOut && (
              <Button
                size="lg"
                className="mt-8"
                onClick={() => document.getElementById('preorder')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                {t('collectionPage.reserve')}
              </Button>
            )}
            {soldOut && (
              <div className="mt-8 inline-flex items-center rounded-full border border-bg/30 px-6 py-3 font-sans text-[12px] uppercase tracking-[0.22em] text-bg/80">
                {t('collectionPage.soldOut')}
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      {/* THREE PREVIEW IMAGES */}
      <section className="shell py-22 md:py-30">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {(c.preview_images.length >= 3 ? c.preview_images : ['', '', '']).map((src, i) => (
            <FadeIn key={i} delay={i * 100}>
              <ImageBlock src={src} alt={`${cName(c, lang)} ${i + 1}`} ratio="3/4" zoom />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* LONG DESCRIPTION */}
      {c.long_description && (
        <section className="bg-bg-100 py-22 md:py-30">
          <div className="content">
            <FadeIn>
              <div className="mx-auto max-w-2xl text-center">
                <p className="eyebrow mb-6">{t('collectionPage.theCollection')}</p>
                <p className="font-serif font-light text-primary text-pretty" style={{ fontSize: 'clamp(1.4rem, 2.4vw, 2rem)', lineHeight: 1.4 }}>
                  {cLongDesc(c, lang)}
                </p>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* OPTIONAL GALLERY */}
      {c.gallery_images && c.gallery_images.length > 0 && (
        <section className="shell py-22 md:py-30">
          <SectionHeader eyebrow={t('collectionPage.gallery.eyebrow')} title={t('collectionPage.gallery.title')} />
          <div className="mt-14">
            <Gallery images={c.gallery_images} columns={3} />
          </div>
        </section>
      )}

      {/* STOCK COUNTER */}
      <section className="bg-primary py-22 md:py-30">
        <div className="content">
          <StockCounter remaining={safeRemaining} max={safeMax} />
        </div>
      </section>

      {/* PREORDER FORM */}
      <section id="preorder" className="shell py-22 md:py-30">
        <SectionHeader
          eyebrow={t('collectionPage.reserve.eyebrow')}
          title={t('collectionPage.reserve.title')}
          description={soldOut ? t('collectionPage.reserve.descSoldOut') : t('collectionPage.reserve.descAvailable')}
        />
        <div className="mx-auto mt-14 max-w-3xl">
          <PreorderForm
            collection={c}
            onSuccess={async () => {
              // Refresh collection so stock counter + form reflect the new state.
              const { data } = await supabase.from('collections').select('*').eq('id', c.id).maybeSingle();
              if (data) setC(data as Collection);
              navigate('/confirmation');
            }}
          />
        </div>
      </section>
    </main>
  );
}

type CollExt = Collection & {
  name_ar?: string;
  short_description_ar?: string;
  long_description_ar?: string;
  seo_title_ar?: string;
  seo_description_ar?: string;
};

function cName(c: Collection | null, lang: string): string {
  if (!c) return '';
  if (lang === 'ar' && (c as CollExt).name_ar) return (c as CollExt).name_ar!;
  return c.name;
}
function cDesc(c: Collection | null, lang: string): string {
  if (!c) return '';
  if (lang === 'ar' && (c as CollExt).short_description_ar) return (c as CollExt).short_description_ar!;
  return c.short_description;
}
function cLongDesc(c: Collection | null, lang: string): string {
  if (!c) return '';
  if (lang === 'ar' && (c as CollExt).long_description_ar) return (c as CollExt).long_description_ar!;
  return c.long_description;
}
function seoTitle(c: Collection | null, lang: string): string {
  if (!c) return '';
  if (lang === 'ar' && (c as CollExt).seo_title_ar) return (c as CollExt).seo_title_ar!;
  return c.seo_title;
}
function seoDesc(c: Collection | null, lang: string): string {
  if (!c) return '';
  if (lang === 'ar' && (c as CollExt).seo_description_ar) return (c as CollExt).seo_description_ar!;
  return c.seo_description;
}
