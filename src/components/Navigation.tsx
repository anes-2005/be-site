import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { navigate, useNavigate, useRouter } from '@/lib/router';
import { useSettings } from '@/lib/settings-context';
import { useLang } from '@/lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Menu, X, Instagram } from 'lucide-react';

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const go = useNavigate();
  const route = useRouter();
  const { settings } = useSettings();
  const { t, lang } = useLang();

  const navLabel = (label: string, to: string): string => {
    if (to === '/') return t('nav.home');
    if (to === '/store') return t('nav.store');
    if (to === '/about') {
      const storyLabel = lang === 'ar' ? settings.story_nav_label_ar : settings.story_nav_label;
      return storyLabel || t('nav.about');
    }
    return label;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (to: string) => {
    setOpen(false);
    if (to.startsWith('/#')) {
      const hash = to.slice(1);
      if (route.path === '/') {
        window.location.hash = hash;
      } else {
        navigate('/');
        setTimeout(() => { window.location.hash = hash; }, 100);
      }
    } else {
      go(to);
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out-soft ${
        scrolled ? 'bg-bg/85 backdrop-blur-md border-b border-line/70' : 'bg-transparent'
      }`}
    >
      <nav className="shell flex h-20 items-center justify-between">
        <button onClick={() => handleNav('/')} className="flex items-center" aria-label="be home">
          <Logo />
        </button>

        <div className="hidden items-center gap-12 md:flex">
          {(settings.nav_links ?? []).map((l) => (
            <button
              key={l.to}
              onClick={() => handleNav(l.to)}
              className="group relative font-sans text-[12px] uppercase tracking-[0.22em] text-ink/70 transition-colors duration-300 hover:text-primary"
            >
              {navLabel(l.label, l.to)}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-primary transition-all duration-500 ease-out-soft group-hover:w-full" />
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <LanguageSwitcher />
          <a
            href={settings.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-ink/70 transition-colors duration-300 hover:text-primary"
          >
            <Instagram size={18} strokeWidth={1.4} />
          </a>
          <button onClick={() => handleNav('/#preorder')} className="btn-primary !px-7 !py-3 !text-[11px]">
            {t('nav.preorder')}
          </button>
        </div>

        <button className="md:hidden text-primary" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X size={22} strokeWidth={1.4} /> : <Menu size={22} strokeWidth={1.4} />}
        </button>
      </nav>

      <div
        className={`md:hidden overflow-hidden border-t border-line/60 bg-bg/95 backdrop-blur-md transition-[max-height,opacity] duration-500 ease-out-soft ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="shell flex flex-col gap-1 py-6">
          {(settings.nav_links ?? []).map((l) => (
            <button
              key={l.to}
              onClick={() => handleNav(l.to)}
              className="py-3 text-left font-sans text-[13px] uppercase tracking-[0.22em] text-ink/80"
            >
              {navLabel(l.label, l.to)}
            </button>
          ))}
          <a
            href={settings.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 font-sans text-[13px] uppercase tracking-[0.22em] text-ink/80"
          >
            {t('nav.instagram')}
          </a>
          <div className="py-3">
            <LanguageSwitcher />
          </div>
          <button onClick={() => handleNav('/#preorder')} className="btn-primary mt-4 w-full">
            {t('nav.preorder')}
          </button>
        </div>
      </div>
    </header>
  );
}
