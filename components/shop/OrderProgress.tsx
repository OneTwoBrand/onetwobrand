'use client';

/**
 * ONE TWO · OrderProgress
 * Barra de progresso do pedido com Supabase Realtime em production_orders.
 * Atualiza sem refresh quando o atelier muda o status da OP.
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, Package, Scissors, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOrderProgress, type OrderProgress as OrderProgressData } from '@/lib/shop/checkout-actions';

const STAGE_ICONS: Record<string, React.ReactNode> = {
  confirmed:   <Package  size={14} strokeWidth={1.5} />,
  production:  <Scissors size={14} strokeWidth={1.5} />,
  finishing:   <Scissors size={14} strokeWidth={1.5} />,
  shipped:     <Truck    size={14} strokeWidth={1.5} />,
  delivered:   <CheckCircle2 size={14} strokeWidth={1.5} />,
};

const STAGE_ORDER = ['confirmed', 'production', 'finishing', 'shipped', 'delivered'];

interface OrderProgressProps {
  orderId:          string;
  initialProgress:  OrderProgressData[];
  compact?:         boolean;
}

export function OrderProgress({ orderId, initialProgress, compact = false }: OrderProgressProps) {
  const [progress, setProgress] = useState<OrderProgressData[]>(initialProgress);

  useEffect(() => {
    if (!orderId) return;

    let active = true;
    const refresh = async () => {
      const result = await getOrderProgress(orderId);
      if (active && !result.error) setProgress(result.progress);
    };
    const timer = window.setInterval(refresh, 15_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [orderId]);

  if (progress.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-ink-soft">
        <Package size={14} strokeWidth={1.5} />
        <span>Aguardando entrada em produção…</span>
      </div>
    );
  }

  const latest = progress[progress.length - 1];
  const pct    = latest.progressPct;
  const stageIdx = STAGE_ORDER.indexOf(latest.stageKey);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-1.5 text-ink font-medium">
            {STAGE_ICONS[latest.stageKey] ?? <Package size={14} />}
            <span>{latest.stageLabel}</span>
          </div>
          <span className="text-ink-soft">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Barra de progresso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-[0.18em] uppercase text-ink-soft">Progresso</span>
          <span className="text-[12px] font-medium text-ink">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Etapas */}
      <div className="flex items-start gap-0">
        {STAGE_ORDER.filter((k) => k !== 'cancelled').map((key, i) => {
          const isDone    = i < stageIdx;
          const isCurrent = i === stageIdx;
          const isPending = i > stageIdx;
          const isLast    = i === STAGE_ORDER.filter((k) => k !== 'cancelled').length - 1;

          return (
            <div key={key} className="flex-1 flex flex-col items-center">
              <div className="flex items-center w-full">
                {/* Dot */}
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors',
                  isDone    && 'bg-primary text-paper',
                  isCurrent && 'bg-primary text-paper ring-4 ring-primary/20',
                  isPending && 'bg-ink/10 text-ink-mute'
                )}>
                  {isDone
                    ? <CheckCircle2 size={12} strokeWidth={2} />
                    : (STAGE_ICONS[key] ?? <Package size={12} />)}
                </div>
                {/* Connector */}
                {!isLast && (
                  <div className={cn(
                    'flex-1 h-0.5 transition-colors',
                    isDone ? 'bg-primary' : 'bg-ink/10'
                  )} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Label atual */}
      <div className="text-center">
        <p className="text-[13px] font-medium text-ink">{latest.stageLabel}</p>
        {latest.updatedAt && (
          <p className="text-[11px] text-ink-soft mt-0.5">
            Atualizado {new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Cuiaba',
            }).format(new Date(latest.updatedAt))}
          </p>
        )}
      </div>

      {/* Se há múltiplas OPs (ex: pedido com vários itens) */}
      {progress.length > 1 && (
        <div className="pt-3 border-t border-line space-y-2">
          <p className="text-[10px] tracking-[0.18em] uppercase text-ink-soft">OPs deste pedido</p>
          {progress.map((op) => (
            <div key={op.opId} className="flex items-center justify-between text-[12px]">
              <span className="text-ink-soft">OP #{op.opNumber}</span>
              <span className={cn(
                'font-medium',
                op.progressPct === 100 ? 'text-success' : 'text-ink'
              )}>
                {op.stageLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
