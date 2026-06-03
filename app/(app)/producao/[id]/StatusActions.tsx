'use client';

import { useState, useTransition } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { changeOPStatus } from './actions';
import type { OPStatus } from '@/lib/types';

const STATUS_FLOW: OPStatus[] = [
  'Aberta',
  'Aguardando Material',
  'Em Produção',
  'Em Bordagem',
  'Em Revisão',
  'Finalizada',
  'Entregue',
];

const STATUS_LABELS: Record<OPStatus, string> = {
  'Aberta': 'Aberta',
  'Aguardando Material': 'Aguardando Material',
  'Em Produção': 'Em Produção',
  'Em Bordagem': 'Em Bordagem',
  'Em Revisão': 'Em Revisão',
  'Finalizada': 'Finalizada',
  'Vendida': 'Vendida',
  'Entregue': 'Entregue',
};

export function StatusActions({ opId, currentStatus }: { opId: string; currentStatus: OPStatus }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  const availableStatuses = STATUS_FLOW.filter((_, i) => i !== currentIndex);

  function handleChange(newStatus: OPStatus) {
    setOpen(false);
    setError('');
    startTransition(async () => {
      try {
        await changeOPStatus(opId, newStatus);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao atualizar status.');
      }
    });
  }

  return (
    <div className="relative">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        icon={<ChevronDown size={14} />}
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
      >
        {isPending ? 'Atualizando…' : 'Alterar status'}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-[14px] border border-line bg-paper shadow-s2">
          {availableStatuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleChange(status)}
              className="w-full px-4 py-3 text-left text-[13px] text-ink hover:bg-surface first:rounded-t-[14px] last:rounded-b-[14px] transition-colors"
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-[11px] text-danger">{error}</p>}
    </div>
  );
}
