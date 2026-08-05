import { type ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'error' | 'dark';

const tones: Record<Tone, string> = {
  neutral: 'bg-bg-300 text-ink/70 border border-line',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  error: 'bg-error/10 text-error border border-error/20',
  dark: 'bg-primary text-bg',
};

export function Badge({ tone = 'neutral', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`badge ${tones[tone]} ${className}`}>{children}</span>;
}
