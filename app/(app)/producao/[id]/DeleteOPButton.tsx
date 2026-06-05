'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { destroyProductionOrder } from './actions';

export function DeleteOPButton({ opId }: { opId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm('Excluir esta OP permanentemente? Esta ação não pode ser desfeita.')) return;
    startTransition(async () => {
      await destroyProductionOrder(opId);
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={handleDelete}
      disabled={isPending}
      icon={<Trash2 size={13} className="text-danger" />}
      className="text-danger hover:bg-danger-soft"
    >
      {isPending ? 'Excluindo...' : 'Excluir'}
    </Button>
  );
}
