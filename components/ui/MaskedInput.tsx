'use client';

import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  formatCpf,
  formatDocumentBR,
  formatMoneyBR,
  formatPhoneBR,
  normalizeMoneyValue,
  onlyDigits,
} from '@/lib/input-masks';

type MaskedInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'defaultValue'> & {
  label?: string;
  hint?: string;
  error?: string;
  defaultValue?: string | number | null;
};

function FieldShell({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('flex flex-col gap-2 font-sans', className)}>
      {label && (
        <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-ink-soft">
          {label}
        </span>
      )}
      <div
        className={cn(
          'flex h-12 items-center rounded-[12px] border bg-paper px-4 transition-all duration-200',
          error
            ? 'border-danger shadow-[0_0_0_4px_var(--ot-danger-soft)] focus-within:shadow-[0_0_0_4px_var(--ot-danger-soft)]'
            : 'border-line focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--ot-primary-soft)]'
        )}
      >
        {children}
      </div>
      {error ? (
        <span className="text-[11px] font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-ink-soft">{hint}</span>
      ) : null}
    </label>
  );
}

export function PhoneInput({ label, hint, error, className, defaultValue, onChange, ...rest }: MaskedInputProps) {
  const [value, setValue] = useState(formatPhoneBR(String(defaultValue ?? '')));

  return (
    <FieldShell label={label} hint={hint} error={error} className={className}>
      <input
        {...rest}
        type="tel"
        inputMode="tel"
        autoComplete={rest.autoComplete ?? 'tel'}
        value={value}
        onChange={(event) => {
          const formatted = formatPhoneBR(event.target.value);
          setValue(formatted);
          onChange?.(event);
        }}
        className="flex-1 bg-transparent text-[14px] font-normal text-ink placeholder:text-ink-mute outline-none"
      />
    </FieldShell>
  );
}

export function CpfInput({ label, hint, error, className, defaultValue, onChange, ...rest }: MaskedInputProps) {
  const [display, setDisplay] = useState(formatCpf(String(defaultValue ?? '')));

  return (
    <FieldShell label={label} hint={hint} error={error} className={className}>
      <input type="hidden" name={rest.name} value={onlyDigits(display)} />
      <input
        {...rest}
        name={undefined}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={(event) => {
          const formatted = formatCpf(event.target.value);
          setDisplay(formatted);
          onChange?.(event);
        }}
        className="flex-1 bg-transparent text-[14px] font-normal text-ink placeholder:text-ink-mute outline-none"
      />
    </FieldShell>
  );
}

export function DocumentInput({ label, hint, error, className, defaultValue, onChange, ...rest }: MaskedInputProps) {
  const [display, setDisplay] = useState(formatDocumentBR(String(defaultValue ?? '')));

  return (
    <FieldShell label={label} hint={hint} error={error} className={className}>
      <input type="hidden" name={rest.name} value={onlyDigits(display)} />
      <input
        {...rest}
        name={undefined}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={(event) => {
          const formatted = formatDocumentBR(event.target.value);
          setDisplay(formatted);
          onChange?.(event);
        }}
        className="flex-1 bg-transparent text-[14px] font-normal text-ink placeholder:text-ink-mute outline-none"
      />
    </FieldShell>
  );
}

export function MoneyInput({ label, hint, error, className, defaultValue, onChange, ...rest }: MaskedInputProps) {
  const [display, setDisplay] = useState(formatMoneyBR(defaultValue));

  return (
    <FieldShell label={label} hint={hint} error={error} className={className}>
      <input type="hidden" name={rest.name} value={normalizeMoneyValue(display)} />
      <input
        {...rest}
        name={undefined}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={display}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d.,R$\s-]/g, '');
          setDisplay(next);
          onChange?.(event);
        }}
        onBlur={() => setDisplay((current) => formatMoneyBR(current))}
        className="flex-1 bg-transparent text-[14px] font-normal text-ink placeholder:text-ink-mute outline-none"
      />
    </FieldShell>
  );
}
