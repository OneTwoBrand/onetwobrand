/**
 * ONE TWO — Badge component
 * Status pills with dot + uppercase label.
 */
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Tone, OPStatus } from '@/lib/types';
import { statusTone } from '@/lib/utils';

type Size = 'sm' | 'md';

interface BadgeProps {
  tone?: Tone;
  size?: Size;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const toneCls: Record<Tone, { bg: string; text: string; dot: string }> = {
  neutral:   { bg: 'bg-ink/[0.06]',       text: 'text-ink',          dot: 'bg-ink-soft' },
  primary:   { bg: 'bg-primary-soft',     text: 'text-primary',      dot: 'bg-primary' },
  secondary: { bg: 'bg-secondary-soft',   text: 'text-[#8A7635]',    dot: 'bg-[#8A7635]' },
  success:   { bg: 'bg-success-soft',     text: 'text-success',      dot: 'bg-success' },
  warning:   { bg: 'bg-warning-soft',     text: 'text-warning',      dot: 'bg-warning' },
  danger:    { bg: 'bg-danger-soft',      text: 'text-danger',       dot: 'bg-danger' },
};

const sizeCls: Record<Size, string> = {
  sm: 'h-5 px-2 text-[9px] tracking-[0.14em]',
  md: 'h-6 px-2.5 text-[10px] tracking-[0.16em]',
};

export function Badge({ tone = 'neutral', size = 'md', dot = true, children, className }: BadgeProps) {
  const c = toneCls[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-sans font-medium uppercase whitespace-nowrap',
        c.bg, c.text, sizeCls[size], className
      )}
    >
      {dot && <span className={cn('w-[5px] h-[5px] rounded-full', c.dot)} />}
      {children}
    </span>
  );
}

/** Status-bound badge — reads tone from status name */
export function StatusBadge({ status, size = 'md', className }: { status: OPStatus; size?: Size; className?: string }) {
  return <Badge tone={statusTone[status]} size={size} className={className}>{status}</Badge>;
}
