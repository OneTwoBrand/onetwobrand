'use client';

import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  formatCnpj,
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

// ─── PIX key types ────────────────────────────────────────────────────────────
type PixKeyType = 'cpf' | 'cnpj' | 'phone' | 'email' | 'random' | 'other';

const PIX_KEY_OPTIONS: { value: PixKeyType; label: string }[] = [
  { value: 'cpf',    label: 'CPF' },
  { value: 'cnpj',   label: 'CNPJ' },
  { value: 'phone',  label: 'Telefone' },
  { value: 'email',  label: 'E-mail' },
  { value: 'random', label: 'Chave aleatória' },
  { value: 'other',  label: 'Outro' },
];

function applyPixMask(type: PixKeyType, raw: string): string {
  switch (type) {
    case 'cpf':   return formatCpf(raw);
    case 'cnpj':  return formatCnpj(raw);
    case 'phone': return formatPhoneBR(raw);
    default:      return raw;
  }
}

function pixInputMode(type: PixKeyType): InputHTMLAttributes<HTMLInputElement>['inputMode'] {
  if (type === 'cpf' || type === 'cnpj') return 'numeric';
  if (type === 'phone') return 'tel';
  if (type === 'email') return 'email';
  return 'text';
}

export function PixKeyInput({
  label = 'Chave PIX',
  hint,
  error,
  className,
  defaultValue,
  name,
}: {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  defaultValue?: string | null;
  name?: string;
}) {
  const [keyType, setKeyType] = useState<PixKeyType>('cpf');
  const [value, setValue] = useState(String(defaultValue ?? ''));

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setKeyType(e.target.value as PixKeyType);
    setValue('');
  }

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setValue(applyPixMask(keyType, raw));
  }

  const placeholder: Record<PixKeyType, string> = {
    cpf:    '000.000.000-00',
    cnpj:   '00.000.000/0000-00',
    phone:  '(67) 9 0000-0000',
    email:  'exemplo@email.com',
    random: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    other:  'Informe a chave',
  };

  return (
    <label className={cn('flex flex-col gap-2 font-sans', className)}>
      {label && (
        <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-ink-soft">
          {label}
        </span>
      )}
      <div
        className={cn(
          'flex items-center rounded-[12px] border bg-paper transition-all duration-200 overflow-hidden',
          error
            ? 'border-danger shadow-[0_0_0_4px_var(--ot-danger-soft)]'
            : 'border-line focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--ot-primary-soft)]'
        )}
      >
        <select
          value={keyType}
          onChange={handleTypeChange}
          className="h-12 shrink-0 border-r border-line bg-surface px-2 text-[12px] text-ink-soft focus:outline-none"
          aria-label="Tipo de chave PIX"
        >
          {PIX_KEY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {name && <input type="hidden" name={name} value={value} />}
        <input
          type={keyType === 'email' ? 'email' : 'text'}
          inputMode={pixInputMode(keyType)}
          autoComplete="off"
          value={value}
          onChange={handleValueChange}
          placeholder={placeholder[keyType]}
          className="flex-1 h-12 bg-transparent px-3 text-[14px] font-normal text-ink placeholder:text-ink-mute outline-none min-w-0"
        />
      </div>
      {error ? (
        <span className="text-[11px] font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-ink-soft">{hint}</span>
      ) : null}
    </label>
  );
}
