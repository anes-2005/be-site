import { type Collection } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';

const CURRENCY_SYMBOLS: Record<string, string> = {
  DZD: 'DZD',
  USD: '$',
  EUR: '€',
  GBP: '£',
  MAD: 'MAD',
  SAR: 'SAR',
  AED: 'AED',
  TND: 'TND',
};

const CURRENCY_LOCALES: Record<string, string> = {
  DZD: 'fr-DZ',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  MAD: 'fr-MA',
  SAR: 'ar-SA',
  AED: 'ar-AE',
  TND: 'fr-TN',
};

export function formatPrice(price: number | null | undefined, currency: string = 'DZD'): string | null {
  if (price == null || isNaN(price)) return null;
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const locale = CURRENCY_LOCALES[currency] ?? 'en-US';
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
  return `${symbol} ${formatted}`;
}

interface PriceTagProps {
  collection: Pick<Collection, 'current_price' | 'old_price' | 'currency'>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center';
}

export function PriceTag({ collection, className = '', size = 'md', align = 'left' }: PriceTagProps) {
  const { settings } = useSettings();
  const current = formatPrice(collection.current_price, collection.currency);
  const old = formatPrice(collection.old_price, collection.currency);
  if (!current) return null;

  const sizes = {
    sm: { cur: settings.price_size_sm_px, old: Math.round(settings.price_size_sm_px * 0.76) },
    md: { cur: 24, old: 14 },
    lg: { cur: settings.price_size_lg_px, old: Math.round(settings.price_size_lg_px * 0.44) },
  } as const;

  const alignClass = align === 'center' ? 'justify-center' : 'justify-start';

  return (
    <div className={`flex items-baseline gap-3 ${alignClass} ${className}`}>
      <span className="font-serif font-light text-primary" style={{ fontSize: `${sizes[size].cur}px` }}>{current}</span>
      {old && (
        <span className="font-sans font-light text-ink/40 line-through" style={{ fontSize: `${sizes[size].old}px` }}>{old}</span>
      )}
    </div>
  );
}
