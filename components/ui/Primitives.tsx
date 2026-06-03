/**
 * ONE TWO — Card / Avatar / SectionHead / Divider primitives
 */
import { type ReactNode, type CSSProperties } from 'react';
import { cn, initials } from '@/lib/utils';

// ─────────────────────────── Card ───────────────────────────
interface CardProps {
  children: ReactNode;
  pad?: number;
  elevated?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}
export function Card({ children, pad = 20, elevated, className, style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{ padding: pad, ...style }}
      className={cn(
        'bg-paper border border-line rounded-[18px]',
        elevated && 'shadow-s2',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

// ─────────────────────── Avatar (initials) ──────────────────
type AvatarTone = 'primary' | 'secondary' | 'neutral';

const avatarTone: Record<AvatarTone, { bg: string; fg: string }> = {
  primary:   { bg: 'bg-primary-soft',   fg: 'text-primary' },
  secondary: { bg: 'bg-secondary-soft', fg: 'text-[#8A7635]' },
  neutral:   { bg: 'bg-ink/[0.08]',     fg: 'text-ink' },
};

export function Avatar({ name, size = 36, tone = 'secondary' }: {
  name: string; size?: number; tone?: AvatarTone;
}) {
  const c = avatarTone[tone];
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={cn(
        'shrink-0 rounded-full font-serif font-medium tracking-[0.05em] flex items-center justify-center',
        c.bg, c.fg
      )}
    >
      {initials(name)}
    </div>
  );
}

// ───────────────────── SectionHead ──────────────────────────
export function SectionHead({ eyebrow, title, action, className }: {
  eyebrow?: string; title: ReactNode; action?: ReactNode; className?: string;
}) {
  return (
    <div className={cn('flex items-end justify-between mb-4', className)}>
      <div>
        {eyebrow && (
          <div className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-1.5">
            {eyebrow}
          </div>
        )}
        <h2 className="font-serif text-[22px] text-ink font-normal m-0">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ─────────────────────── Divider ────────────────────────────
export function Divider({ soft, className, style }: {
  soft?: boolean; className?: string; style?: CSSProperties;
}) {
  return <div style={style} className={cn('h-px', soft ? 'bg-line-soft' : 'bg-line', className)} />;
}

// ─────────────────────── Spinner ────────────────────────────
export function Spinner({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size, borderWidth: Math.max(1.5, size / 20) }}
      className="rounded-full border-line border-t-primary animate-spin"
    />
  );
}

// ───────────────────── Toggle ───────────────────────────────
export function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!on)}
      className={cn(
        'w-10 h-6 rounded-full p-0.5 flex transition-all',
        on ? 'bg-primary justify-end' : 'bg-ink/20 justify-start'
      )}
    >
      <span className="w-5 h-5 rounded-full bg-paper shadow-sm" />
    </button>
  );
}
