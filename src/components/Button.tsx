import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { navigate } from '@/lib/router';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'md' | 'lg';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

const variants: Record<Variant, string> = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
};
const sizes: Record<Size, string> = {
  md: '',
  lg: 'px-12 py-5 text-[13px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

interface LinkButtonProps extends BaseProps {
  to: string;
}

export function LinkButton({ to, variant = 'primary', size = 'md', children, className = '' }: LinkButtonProps) {
  const go = () => navigate(to);
  return (
    <button onClick={go} className={`${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
}

interface AnchorButtonProps extends BaseProps {
  href: string;
  newTab?: boolean;
}

export function AnchorButton({ href, newTab = true, variant = 'primary', size = 'md', children, className = '' }: AnchorButtonProps) {
  return (
    <a
      href={href}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
      className={`${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </a>
  );
}
