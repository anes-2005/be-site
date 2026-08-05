import { useSettings } from '@/lib/settings-context';
import { Logo } from '@/components/Logo';
import { useSeo } from '@/lib/seo';
import { useLang } from '@/lib/i18n';

// Full-screen gate shown to visitors when the site is offline.
export function SiteOffline() {
  const { t } = useLang();
  useSeo({ title: t('offline.seoTitle'), description: t('offline.seoDescription') });
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary px-6 text-center">
      <div className="mb-12">
        <Logo variant="light" className="!h-10" />
      </div>
      <p className="font-serif text-bg/90" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.2 }}>
        {t('offline.title')}
      </p>
      <p className="mt-6 max-w-md font-sans text-[14px] font-light leading-relaxed text-bg/55">
        {t('offline.body')}
      </p>
    </main>
  );
}
