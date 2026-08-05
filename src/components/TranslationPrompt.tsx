import { useLang } from '@/lib/i18n';
import { X } from 'lucide-react';

export function TranslationPrompt() {
  const { promptShown, setLang, dismissPrompt } = useLang();
  if (!promptShown) return null;

  const translate = () => {
    setLang('ar');
    dismissPrompt();
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-[60] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 animate-fade-in md:bottom-6 md:left-auto md:right-6 md:translate-x-0">
      <div className="card overflow-hidden shadow-lift">
        <div className="relative p-6">
          <button
            onClick={dismissPrompt}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-ink/30 transition-colors hover:bg-bg-200 hover:text-ink/60"
            aria-label="Close"
          >
            <X size={15} strokeWidth={1.5} />
          </button>

          <div className="mb-5 flex items-center gap-2.5">
            <span className="text-[1.1rem]">🌐</span>
            <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/40">Language</p>
          </div>

          <p className="font-serif text-[1.15rem] font-light leading-snug text-primary pr-6">
            Would you like to browse this website in Arabic?
          </p>
          <p className="mt-2 font-sans text-[13px] font-light leading-relaxed text-ink/50" dir="rtl">
            هل تفضل تصفح الموقع باللغة العربية؟
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button onClick={translate} className="btn-primary w-full !text-[11px]">
              Translate to Arabic
            </button>
            <button
              onClick={dismissPrompt}
              className="btn-ghost w-full !text-[11px] !py-2.5 border border-line rounded-xl hover:border-primary/30"
            >
              Continue in English
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
