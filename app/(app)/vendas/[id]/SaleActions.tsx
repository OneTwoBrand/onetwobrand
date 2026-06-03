'use client';

import { useTransition, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { markSalePaid, cancelSale } from './actions';

export function SaleActions({ saleId, status }: { saleId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handle(action: (id: string) => Promise<void>) {
    setError('');
    startTransition(async () => {
      try {
        await action(saleId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao atualizar venda.');
      }
    });
  }

  if (status === 'cancelled') return null;

  return (
    <div className="space-y-2">
      {status === 'pending' && (
        <Button
          type="button"
          block
          icon={<CheckCircle size={15} />}
          onClick={() => handle(markSalePaid)}
          disabled={isPending}
        >
          {isPending ? 'Atualizando…' : 'Confirmar pagamento'}
        </Button>
      )}
      {status !== 'cancelled' && (
        <Button
          type="button"
          block
          variant="danger"
          icon={<XCircle size={15} />}
          onClick={() => handle(cancelSale)}
          disabled={isPending}
        >
          Cancelar venda
        </Button>
      )}
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}
