'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/Overlays';
import { deleteSeamstress } from './actions';

export function DeleteSeamstressButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteSeamstress(id);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Excluir ${name}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-danger-soft hover:text-danger transition-colors"
      >
        <Trash2 size={15} />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Excluir costureira?"
        body={`"${name}" será removida permanentemente. Remessas de bordagem vinculadas não serão excluídas.`}
        confirmLabel="Excluir"
        tone="danger"
      />
    </>
  );
}
