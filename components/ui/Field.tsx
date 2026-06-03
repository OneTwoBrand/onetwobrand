'use client';

import { forwardRef, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, children, className, ...rest },
  ref
) {
  return (
    <label className={cn('flex flex-col gap-2 font-sans', className)}>
      {label && (
        <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-ink-soft">
          {label}
        </span>
      )}
      <select
        ref={ref}
        className={cn(
          'h-12 rounded-[12px] border bg-paper px-4 text-[14px] text-ink outline-none transition-all duration-200',
          error
            ? 'border-danger shadow-[0_0_0_4px_var(--ot-danger-soft)]'
            : 'border-line focus:border-primary focus:shadow-[0_0_0_4px_var(--ot-primary-soft)]'
        )}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <span className="text-[11px] font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-ink-soft">{hint}</span>
      ) : null}
    </label>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, ...rest },
  ref
) {
  return (
    <label className={cn('flex flex-col gap-2 font-sans', className)}>
      {label && (
        <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-ink-soft">
          {label}
        </span>
      )}
      <textarea
        ref={ref}
        className={cn(
          'min-h-28 resize-none rounded-[12px] border bg-paper px-4 py-3 text-[14px] leading-relaxed text-ink outline-none transition-all duration-200 placeholder:text-ink-mute',
          error
            ? 'border-danger shadow-[0_0_0_4px_var(--ot-danger-soft)]'
            : 'border-line focus:border-primary focus:shadow-[0_0_0_4px_var(--ot-primary-soft)]'
        )}
        {...rest}
      />
      {error ? (
        <span className="text-[11px] font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-ink-soft">{hint}</span>
      ) : null}
    </label>
  );
});
