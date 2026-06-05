export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatPhoneBR(value: string): string {
  let digits = onlyDigits(value).slice(0, 13);
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
  digits = digits.slice(0, 11);

  if (digits.length <= 2) return digits ? `(${digits}` : '';

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;

  return `(${ddd}) ${rest.slice(0, 1)} ${rest.slice(1, 5)}-${rest.slice(5, 9)}`;
}

export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function formatDocumentBR(value: string): string {
  return onlyDigits(value).length > 11 ? formatCnpj(value) : formatCpf(value);
}

export function parseMoneyBR(value: FormDataEntryValue | string | null): number {
  const raw = String(value ?? '').trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/[^\d,.-]/g, '');
  if (!cleaned) return 0;

  if (cleaned.includes(',')) {
    return Number.parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
  }

  return Number.parseFloat(cleaned) || 0;
}

export function normalizeMoneyValue(value: string): string {
  const amount = parseMoneyBR(value);
  return amount > 0 ? amount.toFixed(2) : '';
}

export function formatMoneyBR(value: string | number | null | undefined): string {
  const amount = typeof value === 'number' ? value : parseMoneyBR(String(value ?? ''));
  if (!amount) return '';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
