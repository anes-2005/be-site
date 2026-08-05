interface ProgressBarProps {
  value: number; // current
  max: number; // total
  className?: string;
  // optional accent color class (default secondary)
  barClass?: string;
}

// Animated horizontal progress bar. Width transitions on value change.
export function ProgressBar({ value, max, className = '', barClass = 'bg-secondary' }: ProgressBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className={`relative h-px w-full overflow-hidden bg-line ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={`absolute inset-y-0 left-0 ${barClass} transition-[width] duration-[1600ms] ease-out-soft`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
