import { useReveal, useCountUp } from '@/lib/hooks';
import { useLang } from '@/lib/i18n';
import { ProgressBar } from './ProgressBar';

interface StockCounterProps {
  remaining: number;
  max: number;
  label?: string;
  soldOutLabel?: string;
}

// Luxury centered stock section with animated number + progress bar.
// Always shows "X / Y pieces remaining" below the bar, synchronized with the bar fill.
export function StockCounter({
  remaining,
  max,
  label,
  soldOutLabel,
}: StockCounterProps) {
  const { ref, visible } = useReveal();
  const { t } = useLang();

  const label_ = label ?? t('stock.label');
  const soldOutLabel_ = soldOutLabel ?? t('stock.soldOut');

  // Null/NaN safety — never render blank, undefined, or hidden.
  const safeRemaining = Number.isFinite(remaining) ? remaining : 0;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;

  const soldOut = safeRemaining <= 0;
  const shown = useCountUp(soldOut ? 0 : safeRemaining, visible, 1600);
  const maxShown = useCountUp(safeMax, visible, 1600);

  // Progress bar fill is based on remaining / max.
  const barValue = soldOut ? 0 : safeRemaining;

  return (
    <div ref={ref} className="text-center">
      <p className="eyebrow mb-8">{t('stock.eyebrow')}</p>
      <div className="flex items-end justify-center gap-3">
        <span
          className={`font-serif font-light leading-none ${soldOut ? 'text-bg-100/40' : 'text-bg-50'}`}
          style={{ fontSize: 'clamp(4rem, 10vw, 8rem)' }}
        >
          {shown}
        </span>
        <span className="font-serif font-light text-bg-100/40 leading-none" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
          / {maxShown}
        </span>
      </div>
      <p className="mt-6 font-sans text-[12px] uppercase tracking-[0.28em] text-bg-100/50">
        {soldOut ? soldOutLabel_ : label_}
      </p>
      <div className="mx-auto mt-10 max-w-md">
        <ProgressBar value={barValue} max={safeMax} />
        {/* Remaining text — always visible, synchronized with the bar */}
        <p className="mt-5 font-sans text-[13px] tracking-[0.05em] text-bg-100/70">
          {soldOut ? '0' : shown} / {maxShown} {t('stock.piecesRemaining')}
        </p>
      </div>
    </div>
  );
}
