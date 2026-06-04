'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/Overlays';
import { deleteCollection } from './actions';

export function DeleteCollectionButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteCollection(id);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Excluir coleção ${name}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-danger-soft hover:text-danger transition-colors"
      >
        <Trash2 size={15} />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Excluir coleção?"
        body={`"${name}" será removida permanentemente. Produtos vinculados a esta coleção não serão excluídos.`}
        confirmLabel="Excluir"
        tone="danger"
      />
    </>
  );
}
