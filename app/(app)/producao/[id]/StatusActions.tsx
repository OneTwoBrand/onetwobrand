'use client';

import { useState, useTransition } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { changeOPStatus } from './actions';

export function StatusActions({
  opId,
  currentStatus,
  allStatuses,
}: {
  opId: string;
  currentStatus: string;
  allStatuses: string[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const available = allStatuses.filter((s) => s !== currentStatus);

  function handleChange(newStatus: string) {
    setOpen(false);
    setError('');
    startTransition(async () => {
      try {
        await changeOPStatus(opId, newStatus as never);
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
          {available.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleChange(status)}
              className="w-full px-4 py-3 text-left text-[13px] text-ink hover:bg-surface first:rounded-t-[14px] last:rounded-b-[14px] transition-colors"
            >
              {status}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-[11px] text-danger">{error}</p>}
    </div>
  );
}
