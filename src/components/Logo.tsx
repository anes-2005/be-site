import { BRAND } from '@/lib/brand';
import { useSettings } from '@/lib/settings-context';

const FALLBACK_SRC = '/684da036-1954-4c1c-8a4b-394ec0aeec24-Photoroom copy.png';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
}

export function Logo({ className = '', variant = 'dark' }: LogoProps) {
  const { settings } = useSettings();
  const src = settings.logo_image || FALLBACK_SRC;
  return (
    <img
      src={src}
      alt={BRAND.name}
      className={`object-contain ${variant === 'light' ? 'invert brightness-0 invert' : ''} ${className}`}
      style={{ height: '2.25rem', width: 'auto' }}
      draggable={false}
    />
  );
}
