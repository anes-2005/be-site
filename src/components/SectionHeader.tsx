import { type ReactNode } from 'react';
import { FadeIn } from './FadeIn';

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'center' | 'left';
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  className = '',
}: SectionHeaderProps) {
  const isCenter = align === 'center';
  return (
    <FadeIn className={`${isCenter ? 'text-center' : 'text-left'} ${className}`}>
      {eyebrow && <p className="eyebrow mb-6">{eyebrow}</p>}
      <h2
        className="font-serif font-light text-primary text-balance"
        style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.08, letterSpacing: '-0.01em' }}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-6 font-sans font-light text-ink/60 text-pretty ${isCenter ? 'mx-auto max-w-xl' : 'max-w-xl'}`}
          style={{ fontSize: 'clamp(0.95rem, 1.2vw, 1.05rem)', lineHeight: 1.7 }}
        >
          {description}
        </p>
      )}
    </FadeIn>
  );
}
