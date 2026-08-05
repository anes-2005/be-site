import { type ReactNode, type ElementType } from 'react';
import { useReveal } from '@/lib/hooks';

interface FadeInProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  // ms transition override
  duration?: number;
}

// Wraps content and fades + lifts it into view on scroll.
export function FadeIn({ children, as: Tag = 'div', className = '', delay = 0, duration }: FadeInProps) {
  const { ref, visible } = useReveal();
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...(duration ? { transitionDuration: `${duration}ms` } : {}) }}
    >
      {children}
    </Tag>
  );
}
