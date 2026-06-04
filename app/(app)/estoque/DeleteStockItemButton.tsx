'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/Overlays';
import { deleteStockItem } from './novo/actions';

export function DeleteStockItemButton({
  stockItemId,
  pieceId,
  name,
}: {
  stockItemId: string;
  pieceId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteStockItem(stockItemId, pieceId);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Excluir ${name}`}
        className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft hover:bg-danger-soft hover:text-danger transition-colors"
      >
        <Trash2 size={14} />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Excluir produto do estoque?"
        body={`"${name}" será removido permanentemente. Se for o único SKU desta peça, a peça também será excluída.`}
        confirmLabel="Excluir"
        tone="danger"
      />
    </>
  );
}
