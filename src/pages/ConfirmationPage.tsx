import { useSeo } from '@/lib/seo';
import { useLang } from '@/lib/i18n';
import { FadeIn } from '@/components/FadeIn';
import { Button } from '@/components/Button';
import { navigate } from '@/lib/router';
import { Check } from 'lucide-react';

export function ConfirmationPage() {
  const { t } = useLang();
  useSeo({ title: 'be — Thank You', description: 'Your preorder has been received.' });

  return (
    <main className="flex min-h-[100svh] items-center justify-center px-6 pt-32 pb-20">
      <FadeIn className="text-center">
        <div className="mx-auto mb-10 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
          <Check size={32} strokeWidth={1.5} />
        </div>

        <p className="eyebrow mb-6">{t('confirmation.eyebrow')}</p>

        <h1 className="font-serif font-light text-primary" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
          {t('confirmation.title')}
        </h1>

        <p className="mx-auto mt-6 max-w-md font-sans text-[15px] font-light leading-relaxed text-ink/60">
          {t('confirmation.body')}
          <br />
          {t('confirmation.body2')}
        </p>

        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-line bg-bg-100 px-8 py-6" dir="rtl">
          <p className="font-serif text-[1.75rem] font-light leading-tight text-primary">
            شكراً لك
          </p>
          <p className="mt-3 font-sans text-[14px] font-light leading-relaxed text-ink/60">
            تم استلام طلبك بنجاح.
            <br />
            سيتم التواصل معك قريباً لتأكيد الطلب.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" onClick={() => navigate('/')}>
            {t('confirmation.returnHome')}
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/store')}>
            {t('confirmation.continueShopping')}
          </Button>
        </div>
      </FadeIn>
    </main>
  );
}
