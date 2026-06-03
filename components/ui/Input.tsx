/**
 * ONE TWO — Input component
 * Editorial label + iconized field + hint/error.
 */
'use client';

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon, rightSlot, type = 'text', className, ...rest },
  ref
) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && revealed ? 'text' : type;

  return (
    <label className={cn('flex flex-col gap-2 font-sans', className)}>
      {label && (
        <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-ink-soft">
          {label}
        </span>
      )}
      <div
        className={cn(
          'flex h-12 items-center gap-[10px] rounded-[12px] bg-paper border px-4 transition-all duration-200',
          error
            ? 'border-danger shadow-[0_0_0_4px_var(--ot-danger-soft)] focus-within:shadow-[0_0_0_4px_var(--ot-danger-soft)]'
            : 'border-line focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--ot-primary-soft)]'
        )}
      >
        {icon && <span className="text-ink-soft shrink-0">{icon}</span>}
        <input
          ref={ref}
          type={inputType}
          className="flex-1 bg-transparent text-[14px] font-normal text-ink placeholder:text-ink-mute outline-none"
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="text-ink-soft shrink-0 hover:text-ink"
            aria-label={revealed ? 'Esconder senha' : 'Mostrar senha'}
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {rightSlot}
      </div>
      {error ? (
        <span className="text-[11px] font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-ink-soft">{hint}</span>
      ) : null}
    </label>
  );
});
