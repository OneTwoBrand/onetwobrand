'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deletePiece } from '../novo/actions';

export function DeletePieceButton({ pieceId, name }: { pieceId: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      await deletePiece(pieceId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-ink-soft transition-colors hover:border-danger hover:text-danger disabled:opacity-40"
      aria-label={`Excluir ${name}`}
      title={`Excluir ${name}`}
    >
      <Trash2 size={15} strokeWidth={1.7} />
    </button>
  );
}
