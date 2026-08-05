import { useEffect, useState, useRef } from 'react';
import { useSettings } from '@/lib/settings-context';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { FadeIn } from '@/components/FadeIn';
import { LinkButton } from '@/components/Button';
import { supabase, type StorySection } from '@/lib/supabase';
import { ArrowRight } from 'lucide-react';

export function AboutPage() {
  const { settings } = useSettings();
  const { t, lang, dir } = useLang();
  const [sections, setSections] = useState<StorySection[]>([]);
  const [progress, setProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const isAr = lang === 'ar';
  const heroTitle = isAr && settings.story_hero_title_ar ? settings.story_hero_title_ar : settings.story_hero_title ?? t('story.defaultHeroTitle');
  const heroSubtitle = isAr && settings.story_hero_subtitle_ar ? settings.story_hero_subtitle_ar : settings.story_hero_subtitle ?? t('story.defaultHeroSubtitle');
  const ctaText = isAr && settings.story_cta_text_ar ? settings.story_cta_text_ar : settings.story_cta_text ?? t('story.defaultCta');
  const ctaLink = settings.story_cta_link ?? '/store';
  const finalMessage = isAr && settings.story_final_message_ar ? settings.story_final_message_ar : settings.story_final_message ?? t('story.defaultFinal');
  const readingTime = settings.story_reading_time ?? 3;

  const seoTitle = isAr && settings.story_seo_title_ar ? settings.story_seo_title_ar : settings.story_seo_title ?? `${settings.brand_name} — ${t('story.eyebrow')}`;
  const seoDesc = isAr && settings.story_seo_description_ar ? settings.story_seo_description_ar : settings.story_seo_description ?? settings.about_title;
  useSeo({ title: seoTitle, description: seoDesc, ogImage: settings.story_og_image ?? undefined });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('story_sections')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true });
      if (error) {
        console.error('[AboutPage] Failed to load story sections:', error.message);
      }
      if (active) setSections((data as StorySection[]) ?? []);
    })();
    return () => { active = false; };
  }, []);

  // Reading progress + parallax scroll value
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
        setScrollY(scrollTop);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main className="overflow-hidden pt-32">
      {/* Reading progress bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent">
        <div
          className="h-full bg-primary transition-[width] duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Hero Statement ── */}
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
        {settings.hero_image && (
          <div
            className="absolute inset-0"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          >
            <img src={settings.hero_image} alt="" className="h-full w-full object-cover opacity-15" />
            <div className="absolute inset-0 bg-gradient-to-b from-bg/50 via-bg/70 to-bg" />
          </div>
        )}
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <FadeIn>
            <p className="eyebrow mb-10 text-secondary/70">{t('story.eyebrow')}</p>
          </FadeIn>
          <FadeIn delay={150}>
            <h1
              className="text-balance font-serif font-light text-primary"
              style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', letterSpacing: '-0.03em', lineHeight: 1.02 }}
            >
              {heroTitle}
            </h1>
          </FadeIn>
          <FadeIn delay={400}>
            <p className="mx-auto mt-12 max-w-xl font-sans text-[15px] font-light leading-relaxed text-ink/50">
              {heroSubtitle}
            </p>
          </FadeIn>
          <FadeIn delay={600}>
            <div className="mt-14 flex items-center justify-center gap-4">
              <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink/35">
                {readingTime} {t('story.minRead')}
              </span>
              <span className="h-3 w-px bg-ink/20" />
              <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink/35">
                {t('story.editorial')}
              </span>
            </div>
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <FadeIn delay={900}>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div className="flex h-10 w-6 items-start justify-center rounded-full border border-ink/20 p-1.5">
              <div className="h-2 w-px animate-scroll-dot bg-ink/30" />
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Story Sections ── */}
      {sections.map((section, i) => {
        if (section.is_quote) return <QuoteBlock key={section.id} section={section} isAr={isAr} scrollY={scrollY} />;

        const title = isAr && section.title_ar ? section.title_ar : section.title;
        const content = isAr && section.content_ar ? section.content_ar : section.content;

        return <StorySectionView key={section.id} section={section} title={title} content={content} isAr={isAr} dir={dir} index={i} scrollY={scrollY} />;
      })}

      {/* ── Final Message ── */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <FadeIn>
            <p
              className="text-balance font-serif font-light text-bg/90"
              style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
            >
              {finalMessage}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="bg-bg-100 py-32 md:py-44">
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-10 font-sans text-[11px] uppercase tracking-[0.28em] text-ink/40">
              {t('story.continue')}
            </p>
            <LinkButton to={ctaLink} size="lg" className="!px-16 !py-6 text-[13px]">
              {ctaText}
              <ArrowRight size={16} strokeWidth={1.5} className="ml-2 inline" />
            </LinkButton>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}

/* ── Quote Block ── */
function QuoteBlock({ section, isAr, scrollY }: { section: StorySection; isAr: boolean; scrollY: number }) {
  const quote = isAr && section.content_ar ? section.content_ar : section.content;
  const isBrand = section.background === 'brand';
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const center = rect.top + rect.height / 2 - window.innerHeight / 2;
    setOffset(center * -0.08);
  }, [scrollY]);

  return (
    <section ref={ref} className={`relative overflow-hidden py-32 md:py-48 ${isBrand ? 'bg-primary' : 'bg-bg-50'}`}>
      <div className="content">
        <div style={{ transform: `translateY(${offset}px)` }}>
          <FadeIn>
            <blockquote
              className={`mx-auto max-w-5xl text-center font-serif font-light ${isBrand ? 'text-bg/85' : 'text-primary'}`}
              style={{ fontSize: 'clamp(1.75rem, 4.5vw, 3.5rem)', letterSpacing: '-0.02em', lineHeight: 1.2 }}
            >
              <span className="mb-2 block font-serif text-[4rem] leading-none opacity-15">&ldquo;</span>
              <span className="-mt-6 block text-balance">{quote}</span>
            </blockquote>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ── Story Section ── */
function StorySectionView({
  section, title, content, isAr, dir, index, scrollY,
}: {
  section: StorySection;
  title: string;
  content: string;
  isAr: boolean;
  dir: 'ltr' | 'rtl';
  index: number;
  scrollY: number;
}) {
  const bgClass = section.background === 'brand' ? 'bg-primary/5' : section.background === 'white' ? 'bg-bg-50' : 'bg-bg-100';
  const hasImage = section.background === 'image' && section.image_url;
  const hasVideo = section.background === 'video' && section.video_url;

  // Full-width image or video background
  if (section.layout === 'full_width' && (hasImage || hasVideo)) {
    return (
      <section className="relative min-h-[75vh] overflow-hidden">
        {hasVideo ? (
          <video src={section.video_url!} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <img src={section.image_url!} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-bg/50 to-bg/85" />
        <div className="relative z-10 flex min-h-[75vh] items-center justify-center">
          <FadeIn>
            <div className="mx-auto max-w-2xl px-6 text-center">
              {title && <h2 className="text-balance font-serif text-[2rem] font-light text-bg md:text-[3.5rem]" style={{ letterSpacing: '-0.02em', lineHeight: 1.1 }}>{title}</h2>}
              <p className="mt-8 font-sans text-[15px] font-light leading-relaxed text-bg/70">{content}</p>
            </div>
          </FadeIn>
        </div>
      </section>
    );
  }

  // Image-only layout
  if (section.layout === 'image_only' && section.image_url) {
    return (
      <section className={`py-12 md:py-20 ${bgClass}`}>
        <div className="content">
          <FadeIn>
            <div className="overflow-hidden">
              <img src={section.image_url} alt={title} className="h-full w-full object-cover" style={{ aspectRatio: '16/9' }} />
            </div>
          </FadeIn>
        </div>
      </section>
    );
  }

  // Left image / right image / centered / text-only
  const isLeftImage = section.layout === 'left_image';
  const isCentered = section.layout === 'centered' || section.layout === 'text_only';

  const TextContent = (
    <FadeIn>
      {title && (
        <h2
          className="text-balance font-serif font-light text-primary"
          style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
        >
          {title}
        </h2>
      )}
      <p className="mt-8 font-sans text-[16px] font-light leading-[1.9] text-ink/50">{content}</p>
    </FadeIn>
  );

  const ImageContent = section.image_url ? (
    <FadeIn delay={120}>
      <div className="overflow-hidden rounded-2xl">
        <img src={section.image_url} alt={title} className="h-full w-full object-cover img-zoom-target" style={{ aspectRatio: '4/5' }} />
      </div>
    </FadeIn>
  ) : null;

  if (isCentered) {
    return (
      <section className={`py-28 md:py-44 ${bgClass}`}>
        <div className="content">
          <div className="mx-auto max-w-3xl text-center">
            {TextContent}
          </div>
        </div>
      </section>
    );
  }

  // Split layouts
  const imageFirst = isLeftImage;
  const reversed = dir === 'rtl' ? !imageFirst : imageFirst;

  return (
    <section className={`py-28 md:py-44 ${bgClass}`}>
      <div className="content">
        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2 md:gap-24">
          <div className={reversed ? 'md:order-1' : 'md:order-2'}>
            {ImageContent}
          </div>
          <div className={reversed ? 'md:order-2' : 'md:order-1'}>
            {TextContent}
          </div>
        </div>
      </div>
    </section>
  );
}
