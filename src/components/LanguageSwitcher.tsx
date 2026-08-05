import { useLang, type Lang } from '@/lib/i18n';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();

  const switchTo: Lang = lang === 'en' ? 'ar' : 'en';
  const label = lang === 'en' ? 'العربية' : 'EN';

  return (
    <button
      onClick={() => setLang(switchTo)}
      className={`group flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-[0.18em] text-ink/55 transition-colors duration-300 hover:text-primary ${className}`}
      aria-label={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
    >
      <span className="text-ink/30 transition-colors group-hover:text-primary/40">|</span>
      <span>{label}</span>
    </button>
  );
}
