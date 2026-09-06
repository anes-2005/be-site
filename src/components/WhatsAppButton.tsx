import { useSettings } from '@/lib/settings-context';
import { useLang } from '@/lib/i18n';

export function WhatsAppButton() {
  const { settings } = useSettings();
  const { lang } = useLang();
  const number = settings.whatsapp_number?.replace(/\D/g, '');
  if (!number) return null;

  const message = lang === 'ar'
    ? 'مرحبًا، عندي سؤال عن be.'
    : 'Hi, I have a question about be.';
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition-transform hover:scale-105 ltr:right-6 rtl:left-6"
    >
      <svg viewBox="0 0 32 32" fill="currentColor" className="h-7 w-7">
        <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.31.641 4.47 1.756 6.313L4 29l7.86-1.723A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.75a9.7 9.7 0 0 1-4.95-1.357l-.355-.21-4.665 1.023 1.007-4.55-.232-.372A9.68 9.68 0 0 1 5.25 15c0-5.93 4.82-10.75 10.754-10.75 5.933 0 10.75 4.82 10.75 10.75S21.938 24.75 16.004 24.75Zm5.87-8.03c-.32-.16-1.895-.936-2.19-1.043-.294-.107-.508-.16-.723.16-.213.32-.827 1.042-1.014 1.257-.187.213-.373.24-.694.08-.32-.16-1.352-.498-2.575-1.588-.952-.85-1.594-1.897-1.782-2.217-.187-.32-.02-.492.14-.652.144-.144.32-.373.48-.56.16-.187.213-.32.32-.534.107-.213.053-.4-.027-.56-.08-.16-.723-1.744-.99-2.39-.26-.628-.526-.543-.723-.553l-.616-.01c-.213 0-.56.08-.854.4-.293.32-1.12 1.093-1.12 2.667s1.146 3.093 1.306 3.307c.16.213 2.256 3.443 5.465 4.83.764.33 1.36.526 1.825.673.767.244 1.465.21 2.017.127.615-.092 1.895-.774 2.163-1.522.267-.747.267-1.387.187-1.522-.08-.134-.293-.213-.613-.373Z" />
      </svg>
    </a>
  );
}
