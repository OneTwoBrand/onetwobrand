'use client';

import { useActionState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateProfile, updatePassword, type ProfileActionState } from './actions';

export function ProfileForm({ currentName }: { currentName: string }) {
  const [state, action, pending] = useActionState(updateProfile, {});

  return (
    <form action={action} className="space-y-4">
      <Input
        name="full_name"
        label="Nome completo"
        defaultValue={currentName}
        placeholder="Seu nome"
        required
      />
      {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-[12px] text-success">
          <Check size={13} /> {state.success}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending} block>
        {pending ? 'Salvando…' : 'Salvar nome'}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {} as ProfileActionState);

  return (
    <form action={action} className="space-y-4">
      <Input name="current_password" label="Senha atual" type="password" placeholder="••••••••" required />
      <Input name="new_password" label="Nova senha" type="password" placeholder="mín. 8 caracteres" required />
      <Input name="confirm_password" label="Confirmar nova senha" type="password" placeholder="••••••••" required />
      {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-[12px] text-success">
          <Check size={13} /> {state.success}
        </p>
      )}
      <Button type="submit" size="sm" variant="secondary" disabled={pending} block>
        {pending ? 'Alterando…' : 'Alterar senha'}
      </Button>
    </form>
  );
}
