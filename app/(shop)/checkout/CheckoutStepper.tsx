/**
 * ONE TWO · CheckoutStepper
 * Barra de progresso com 4 passos — 100% largura, mobile-first.
 */
import { cn } from '@/lib/utils';

interface CheckoutStepperProps {
  steps: string[];
  active: number; // 1-based
}

export function CheckoutStepper({ steps, active }: CheckoutStepperProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Barras */}
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={cn(
            'flex-1 h-1.5 rounded-full transition-colors',
            i < active ? 'bg-primary' : 'bg-line'
          )} />
        ))}
      </div>
      {/* Labels */}
      <div className="flex">
        {steps.map((label, i) => (
          <span key={i} className={cn(
            'flex-1 text-[9px] font-medium tracking-[0.16em] uppercase text-center',
            i + 1 === active ? 'text-primary' : i < active ? 'text-ink-soft' : 'text-ink-mute'
          )}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
