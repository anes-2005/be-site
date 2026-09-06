import { useSeo } from '@/lib/seo';
import { useLang } from '@/lib/i18n';
import { FadeIn } from '@/components/FadeIn';
import { Button } from '@/components/Button';
import { navigate } from '@/lib/router';
import { Compass } from 'lucide-react';

export function NotFoundPage() {
  const { t, lang } = useLang();
  useSeo({
    title: 'be — Page Not Found',
    description: lang === 'ar' ? 'الصفحة التي تبحث عنها غير موجودة.' : 'The page you are looking for does not exist.',
  });

  return (
    <main className="flex min-h-[100svh] items-center justify-center px-6 pb-20 pt-32">
      <FadeIn className="text-center">
        <p
          className="font-serif font-light text-primary/15"
          style={{ fontSize: 'clamp(6rem, 18vw, 12rem)', lineHeight: 1 }}
        >
          404
        </p>

        <div className="mx-auto -mt-6 mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/15 text-secondary">
          <Compass size={26} strokeWidth={1.4} />
        </div>

        <h1
          className="font-serif font-light text-primary"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
        >
          {lang === 'ar' ? 'هذه الصفحة غير موجودة' : "This page doesn't exist"}
        </h1>

        <p className="mx-auto mt-5 max-w-sm font-sans text-[15px] font-light leading-relaxed text-ink/55">
          {lang === 'ar'
            ? 'ربما تغيّر الرابط أو كُتب بشكل خاطئ. تفضّل بزيارة الصفحة الرئيسية أو المتجر.'
            : 'The link may be broken or the page may have moved. Try the home page or the store instead.'}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" onClick={() => navigate('/')}>
            {lang === 'ar' ? 'الصفحة الرئيسية' : 'Go Home'}
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/store')}>
            {t('nav.store') || (lang === 'ar' ? 'المتجر' : 'Store')}
          </Button>
        </div>
      </FadeIn>
    </main>
  );
}
