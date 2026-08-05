import { type Collection, type AvailabilityStatus } from '@/lib/supabase';
import { ImageBlock } from './ImageBlock';
import { Badge } from './Badge';
import { PriceTag } from './PriceTag';
import { navigate } from '@/lib/router';
import { useLang } from '@/lib/i18n';

const statusTone: Record<AvailabilityStatus, 'success' | 'warning' | 'error'> = {
  available: 'success',
  coming_soon: 'warning',
  sold_out: 'error',
};
const statusLabel: Record<AvailabilityStatus, string> = {
  available: 'card.available',
  coming_soon: 'card.comingSoon',
  sold_out: 'card.soldOut',
};

interface CollectionCardProps {
  collection: Collection;
  className?: string;
}

export function CollectionCard({ collection, className = '' }: CollectionCardProps) {
  const c = collection;
  const { t, lang } = useLang();
  const go = () => navigate(`/collection/${encodeURIComponent(c.slug)}`);

  return (
    <article
      className={`group cursor-pointer ${className}`}
      onClick={go}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go()}
    >
      <div className="img-zoom relative overflow-hidden rounded-2xl border border-line">
        <ImageBlock src={c.cover_image} alt={c.name} ratio="4/5" />
        <div className="absolute left-4 top-4 z-10">
          <Badge tone={statusTone[c.availability_status]}>{t(statusLabel[c.availability_status])}</Badge>
        </div>
      </div>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-[1.5rem] font-light leading-tight text-primary">{c.name}</h3>
          <p className="mt-2 font-sans text-[14px] font-light leading-relaxed text-ink/55 line-clamp-2">
            {lang === 'ar' && (c as Collection & { short_description_ar?: string }).short_description_ar
              ? (c as Collection & { short_description_ar?: string }).short_description_ar
              : c.short_description}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <div className="flex flex-col gap-1">
          <PriceTag collection={c} size="sm" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/45">
            {c.remaining_stock} / {c.max_stock} {t('card.remaining')}
          </span>
        </div>
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-primary transition-all duration-300 group-hover:tracking-[0.28em]">
          {t('card.viewCollection')}
        </span>
      </div>
    </article>
  );
}
