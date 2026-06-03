'use client';

import { useState, useTransition } from 'react';
import { MoreHorizontal, ShieldOff, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { updateUserRole, toggleUserActive, removeUser } from './actions';
import { ROLE_LABEL, ROLE_TONE } from '@/lib/users-data';

type Role = 'admin' | 'atelier' | 'viewer';

export function RoleSelector({ userId, currentRole }: { userId: string; currentRole: Role }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as Role;
    setError('');
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro.');
      }
    });
  }

  return (
    <div>
      <select
        defaultValue={currentRole}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-[8px] border border-line bg-paper px-2 py-1 text-[12px] text-ink focus:border-primary focus:outline-none disabled:opacity-50"
      >
        <option value="admin">Admin</option>
        <option value="atelier">Atelier</option>
        <option value="viewer">Visualizador</option>
      </select>
      {error && <p className="mt-1 text-[10px] text-danger">{error}</p>}
    </div>
  );
}

export function UserMenu({ userId, active, isSelf }: { userId: string; active: boolean; isSelf: boolean }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  function handle(action: () => Promise<void>) {
    setOpen(false);
    setError('');
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro.');
      }
    });
  }

  if (isSelf) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-surface transition-colors disabled:opacity-40"
        aria-label="Ações"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-[14px] border border-line bg-paper shadow-s2">
          <button
            type="button"
            onClick={() => handle(() => toggleUserActive(userId, active))}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13px] text-ink hover:bg-surface rounded-t-[14px] transition-colors"
          >
            {active ? <ShieldOff size={15} className="text-warning" /> : <ShieldCheck size={15} className="text-success" />}
            {active ? 'Desativar acesso' : 'Reativar acesso'}
          </button>
          <div className="h-px bg-line mx-3" />
          {!confirmRemove ? (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13px] text-danger hover:bg-danger-soft rounded-b-[14px] transition-colors"
            >
              <Trash2 size={15} />
              Remover usuário
            </button>
          ) : (
            <div className="px-4 py-3">
              <p className="text-[11px] text-ink-soft mb-2">Confirmar remoção? Esta ação é irreversível.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handle(() => removeUser(userId))}
                  className="flex-1 rounded-[8px] bg-danger py-1.5 text-[11px] font-medium text-paper"
                >
                  Remover
                </button>
                <button
                  type="button"
                  onClick={() => { setConfirmRemove(false); setOpen(false); }}
                  className="flex-1 rounded-[8px] border border-line py-1.5 text-[11px] text-ink"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-[10px] text-danger">{error}</p>}
    </div>
  );
}
