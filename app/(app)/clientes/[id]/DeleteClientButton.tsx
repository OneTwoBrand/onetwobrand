'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Overlays';
import { deleteClient } from '../novo/actions';

export function DeleteClientButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteClient(id);
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        icon={<Trash2 size={14} />}
        onClick={() => setOpen(true)}
        className="text-danger hover:bg-danger-soft"
      >
        Excluir
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Excluir cliente?"
        body="Esta ação é irreversível. O cadastro e o histórico de vendas vinculadas serão removidos permanentemente."
        confirmLabel="Excluir"
        tone="danger"
      />
    </>
  );
}
