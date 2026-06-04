'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/Overlays';
import { deleteShipment } from './novo/actions';

export function DeleteShipmentButton({ id, code }: { id: string; code: string }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteShipment(id);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Excluir remessa ${code}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-danger-soft hover:text-danger transition-colors"
      >
        <Trash2 size={15} />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Excluir remessa?"
        body={`A remessa ${code} será removida permanentemente. As OPs vinculadas não serão excluídas.`}
        confirmLabel="Excluir"
        tone="danger"
      />
    </>
  );
}
