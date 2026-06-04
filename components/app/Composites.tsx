/**
 * ONE TWO — App-level composites
 * KPI · OPRow · KanbanCard · QtyStepper · MultiStepProgress · EmptyState
 */
'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { Calendar, MoreHorizontal, Plus, Minus } from 'lucide-react';
import { cn, daysUntil } from '@/lib/utils';
import { Card, Avatar, Divider } from '../ui/Primitives';
import { StatusBadge } from '../ui/Badge';
import type { OPStatus } from '@/lib/types';

// ────────── KPI mini-card ──────────
type KPITone = 'primary' | 'secondary' | 'warning' | 'neutral';
const kpiTone: Record<KPITone, { bg: string; fg: string }> = {
  primary:   { bg: 'bg-primary-soft',   fg: 'text-primary' },
  secondary: { bg: 'bg-secondary-soft', fg: 'text-[#8A7635]' },
  warning:   { bg: 'bg-warning-soft',   fg: 'text-warning' },
  neutral:   { bg: 'bg-ink/[0.06]',     fg: 'text-ink' },
};

export function KPI({ icon, label, value, delta, tone = 'neutral' }: {
  icon: ReactNode; label: string; value: ReactNode; delta?: string; tone?: KPITone;
}) {
  const c = kpiTone[tone];
  return (
    <Card pad={14}>
      <div className="flex justify-between items-start">
        <div className={cn('w-8 h-8 rounded-[10px] flex items-center justify-center', c.bg, c.fg)}>
          {icon}
        </div>
        <span className="text-[9px] tracking-[0.18em] uppercase text-ink-soft mt-1">{label}</span>
      </div>
      <div className="font-serif text-[28px] text-ink mt-1 leading-none">{value}</div>
      {delta && <div className="text-[10px] text-ink-soft mt-0.5">{delta}</div>}
    </Card>
  );
}

// ────────── OPRow — Production Order card ──────────
export function OPRow({
  opNumber, productName, clientName, qty, seamstressName, dueDate, status, href, orderSource,
}: {
  opNumber: string;
  productName: string;
  clientName: string;
  qty: number;
  seamstressName?: string;
  dueDate: string;       // ISO
  status: OPStatus;
  href?: string;
  orderSource?: string;
}) {
  const due = daysUntil(dueDate);
  const dueColor = due.tone === 'danger' ? 'text-danger' : due.tone === 'warning' ? 'text-warning' : 'text-ink-soft';
  const isShop = orderSource === 'shop';
  const inner = (
    <Card pad={16}>
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-ink-soft">OP · {opNumber}</span>
          {isShop && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold tracking-wide-1 uppercase bg-primary/10 text-primary">
              Loja
            </span>
          )}
        </div>
        <StatusBadge status={status} size="sm" />
      </div>
      <div className="font-serif text-[17px] text-ink mt-2 leading-[1.2]">{productName}</div>
      <div className="text-[12px] text-ink-soft mt-1">
        {clientName} · {qty} {qty > 1 ? 'peças' : 'peça'}
      </div>
      <Divider className="my-3" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {seamstressName ? <Avatar name={seamstressName} size={24} tone="secondary" /> : <span className="w-6 h-6 rounded-full border border-dashed border-line" />}
          <span className="text-[11px] text-ink-soft">{seamstressName ?? '— atribuir'}</span>
        </div>
        <div className={cn('flex items-center gap-1.5 text-[11px] font-medium', dueColor)}>
          <Calendar size={12} strokeWidth={1.5} />
          {due.label}
        </div>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ────────── KanbanCard — compact for desktop board ──────────
export function KanbanCard({ opNumber, productName, clientName, qty, dueDate }: {
  opNumber: string; productName: string; clientName: string; qty: number; dueDate: string;
}) {
  const due = daysUntil(dueDate);
  const dueColor = due.tone === 'danger' ? 'text-danger' : due.tone === 'warning' ? 'text-warning' : 'text-ink-soft';
  return (
    <Card pad={14} className="shadow-s1">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[10px] text-ink-soft">#{opNumber}</span>
        <MoreHorizontal size={14} className="text-ink-soft" />
      </div>
      <div className="font-serif text-[15px] text-ink mt-2 leading-[1.2]">{productName}</div>
      <div className="text-[11px] text-ink-soft mt-0.5">{clientName} · {qty}p</div>
      <Divider className="my-2.5" />
      <div className="flex items-center justify-between">
        <Avatar name={clientName} size={22} tone="secondary" />
        <span className={cn('text-[10px] font-medium', dueColor)}>{due.label}</span>
      </div>
    </Card>
  );
}

// ────────── QtyStepper ──────────
export function QtyStepper({ value, onChange, min = 1, max = 99 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="inline-flex items-center bg-bg rounded-full p-0.5 gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-[26px] h-[26px] rounded-full bg-paper text-ink flex items-center justify-center disabled:opacity-40"
        aria-label="Diminuir"
      >
        <Minus size={12} />
      </button>
      <span className="min-w-4 text-center text-[13px] font-medium text-ink">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-[26px] h-[26px] rounded-full bg-primary text-paper flex items-center justify-center disabled:opacity-40"
        aria-label="Aumentar"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

// ────────── MultiStepProgress (Vendas) ──────────
export function MultiStepProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="px-5 pb-5">
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 h-[3px] rounded-full',
              i < current ? 'bg-primary' : 'bg-ink/10'
            )}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[9px] tracking-[0.14em] uppercase text-ink-soft">
        {steps.map((label, i) => (
          <span key={label} className={cn(i === current - 1 && 'text-primary font-medium')}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ────────── EmptyState ──────────
export function EmptyState({ icon, title, body, action }: {
  icon: ReactNode; title: string; body?: string; action?: ReactNode;
}) {
  return (
    <Card pad={22} className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-surface border border-line flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="font-serif text-[18px] text-ink mt-3.5">{title}</div>
      {body && <div className="text-[12px] text-ink-soft mt-1.5 leading-[1.5] max-w-[260px]">{body}</div>}
      {action && <div className="mt-3.5">{action}</div>}
    </Card>
  );
}
