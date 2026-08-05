import { type Collection } from '@/lib/supabase';

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
  const current = formatPrice(collection.current_price, collection.currency);
  const old = formatPrice(collection.old_price, collection.currency);
  if (!current) return null;

  const sizes = {
    sm: { cur: 'text-[15px]', old: 'text-[12px]' },
    md: { cur: 'text-[1.25rem]', old: 'text-[13px]' },
    lg: { cur: 'text-[1.75rem]', old: 'text-[15px]' },
  } as const;

  const alignClass = align === 'center' ? 'justify-center' : 'justify-start';

  return (
    <div className={`flex items-baseline gap-3 ${alignClass} ${className}`}>
      <span className={`font-serif font-light text-primary ${sizes[size].cur}`}>{current}</span>
      {old && (
        <span className={`font-sans font-light text-ink/40 line-through ${sizes[size].old}`}>{old}</span>
      )}
    </div>
  );
}
