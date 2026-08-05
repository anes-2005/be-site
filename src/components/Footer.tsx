import { Logo } from './Logo';
import { useSettings } from '@/lib/settings-context';
import { useLang } from '@/lib/i18n';
import { Instagram } from 'lucide-react';

export function Footer() {
  const { settings } = useSettings();
  const { t, lang } = useLang();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-bg-100">
      <div className="content py-20 md:py-28">
        <div className="flex flex-col items-center gap-10 text-center">
          <Logo />
          <a
            href={settings.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-ink/60 transition-colors duration-300 hover:text-primary"
          >
            <Instagram size={20} strokeWidth={1.4} />
          </a>
          <div className="h-px w-16 bg-line" />
          <p className="font-sans text-[11px] uppercase tracking-[0.24em] text-ink/40">
            © {year} {lang === 'ar' && settings.brand_name_ar ? settings.brand_name_ar : settings.brand_name}. {lang === 'ar' && settings.footer_note_ar ? settings.footer_note_ar : (settings.footer_note || t('footer.rights'))}
          </p>
        </div>
      </div>
    </footer>
  );
}
