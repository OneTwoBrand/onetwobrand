'use client';

import { useState, useTransition } from 'react';
import { MoreHorizontal, ShieldOff, ShieldCheck, Trash2, ChevronDown } from 'lucide-react';
import { updateUserRole, toggleUserActive, removeUser, saveNavPermissions } from './actions';
import { ALL_NAV_HREFS, NAV_LABELS, parseNavPermissions, type NavHref } from '@/lib/nav-permissions';

type Role = 'admin' | 'atelier' | 'viewer' | 'vendedora';

export function RoleSelector({ userId, currentRole }: { userId: string; currentRole: Role }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as Role;
    setError('');
    setSuccess('');
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
        setSuccess('Categoria salva.');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro.');
      }
    });
  }

  return (
    <div className="text-right">
      <select
        defaultValue={currentRole}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-[8px] border border-line bg-paper px-2 py-1 text-[12px] text-ink focus:border-primary focus:outline-none disabled:opacity-50"
      >
        <option value="admin">Admin</option>
        <option value="atelier">Atelier</option>
        <option value="vendedora">Vendedora</option>
        <option value="viewer">Visualizador</option>
      </select>
      {error && <p className="mt-1 text-[10px] text-danger">{error}</p>}
      {success && <p className="mt-1 text-[10px] text-success">{success}</p>}
    </div>
  );
}

export function NavPermissionsPanel({
  userId,
  currentRole,
  navPermissions,
}: {
  userId: string;
  currentRole: string;
  navPermissions: string[] | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const current: NavHref[] = navPermissions
    ? parseNavPermissions(navPermissions)
    : [...ALL_NAV_HREFS];

  const [selected, setSelected] = useState<Set<NavHref>>(new Set(current));

  // Admin always has full access — no need to configure
  if (currentRole === 'admin') return null;

  function toggle(href: NavHref) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  function handleSave() {
    setError('');
    setSuccess('');
    startTransition(async () => {
      try {
        await saveNavPermissions(userId, [...selected]);
        setSuccess('Permissões salvas.');
        setTimeout(() => setSuccess(''), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao salvar.');
      }
    });
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">
          Módulos visíveis
        </span>
        <ChevronDown
          size={14}
          className={`text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_NAV_HREFS.map((href) => {
              const checked = selected.has(href);
              return (
                <label
                  key={href}
                  className={`flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-[12px] transition-colors ${
                    checked
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-line bg-surface text-ink-soft'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggle(href)}
                  />
                  <span
                    className={`h-3.5 w-3.5 shrink-0 rounded-sm border ${
                      checked ? 'border-primary bg-primary' : 'border-line bg-paper'
                    }`}
                  />
                  {NAV_LABELS[href]}
                </label>
              );
            })}
          </div>

          {error && <p className="text-[11px] text-danger">{error}</p>}
          {success && <p className="text-[11px] text-success">{success}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="w-full rounded-[10px] bg-primary py-2 text-[12px] font-medium text-paper transition-opacity disabled:opacity-50"
          >
            {isPending ? 'Salvando…' : 'Salvar permissões'}
          </button>
        </div>
      )}
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
