/**
 * ONE TWO — Button component
 * Tailwind + tokens; pill shape, 5 variants, 3 sizes.
 */
'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const sizeCls: Record<Size, string> = {
  sm: 'h-[34px] px-[14px] text-[11px] tracking-[0.16em]',
  md: 'h-[44px] px-[20px] text-[12px] tracking-[0.18em]',
  lg: 'h-[52px] px-[26px] text-[13px] tracking-[0.20em]',
};

const variantCls: Record<Variant, string> = {
  primary:
    'bg-primary text-paper border border-transparent hover:bg-primary-hover',
  secondary:
    'bg-transparent text-ink border border-ink hover:bg-ink/[0.05]',
  ghost:
    'bg-transparent text-ink border border-transparent hover:bg-ink/[0.05]',
  danger:
    'bg-transparent text-danger border border-danger hover:bg-danger-soft',
  soft:
    'bg-primary-soft text-primary border border-transparent hover:bg-primary/[0.14]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block, icon, iconRight, children, className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-[10px] rounded-full font-sans font-medium uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed',
        sizeCls[size],
        variantCls[variant],
        block && 'w-full',
        className
      )}
      {...rest}
    >
      {icon}
      <span>{children}</span>
      {iconRight}
    </button>
  );
});
