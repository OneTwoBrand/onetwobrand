/**
 * ONE TWO — Utility helpers
 * Coloque em lib/utils.ts
 */
import type { OPStatus, Tone } from './types';

/** Maps OP status → Badge tone */
export const statusTone: Record<OPStatus, Tone> = {
  'Aberta': 'neutral',
  'Aguardando Material': 'warning',
  'Em Produção': 'primary',
  'Em Bordagem': 'secondary',
  'Em Revisão': 'warning',
  'Finalizada': 'success',
  'Vendida': 'success',
  'Entregue': 'success',
};

/** "Maria Helena" → "MH" */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

/** R$ 48720 → "R$ 48.720" (no decimals for ATC display) */
export function brl(value: number, opts: { decimals?: boolean } = {}): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  }).format(value);
}

/** Tailwind class composer */
export function cn(...inputs: (string | false | null | undefined)[]): string {
  return inputs.filter(Boolean).join(' ');
}

/** Days from now → "Em 4 dias" / "Hoje" / "Atrasado" */
export function daysUntil(iso: string): { label: string; tone: 'normal' | 'warning' | 'danger' } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diff < 0) return { label: 'Atrasado', tone: 'danger' };
  if (diff === 0) return { label: 'Hoje', tone: 'danger' };
  if (diff === 1) return { label: 'Amanhã', tone: 'warning' };
  if (diff <= 3) return { label: `Em ${diff} dias`, tone: 'warning' };
  return { label: `Em ${diff} dias`, tone: 'normal' };
}
