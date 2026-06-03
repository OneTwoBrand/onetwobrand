'use client';

import { useActionState, useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateProfile, updatePassword, saveOpenAIKey, type ProfileActionState } from './actions';

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

export function AdminAIConfigForm({ isConfigured }: { isConfigured: boolean }) {
  const [state, action, pending] = useActionState(saveOpenAIKey, {} as ProfileActionState);
  const [revealed, setRevealed] = useState(false);

  return (
    <form action={action} className="space-y-4">
      {isConfigured && !state?.error && (
        <div className="flex items-center gap-2 rounded-[10px] bg-success-soft px-3 py-2">
          <Check size={13} className="text-success" />
          <span className="text-[12px] text-success">Chave OpenAI configurada e ativa.</span>
        </div>
      )}
      <div className="relative">
        <Input
          name="openai_api_key"
          label="Nova chave OpenAI (sk-…)"
          type={revealed ? 'text' : 'password'}
          placeholder="sk-proj-…"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="absolute bottom-3 right-4 text-ink-soft hover:text-ink"
          aria-label={revealed ? 'Ocultar chave' : 'Revelar chave'}
        >
          {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      <p className="text-[11px] text-ink-soft">
        Obtenha sua chave em platform.openai.com → API keys. A chave é criptografada antes de ser salva e nunca fica visível após o cadastro.
      </p>
      {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-[12px] text-success">
          <Check size={13} /> {state.success}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending} block>
        {pending ? 'Validando e salvando…' : isConfigured ? 'Atualizar chave' : 'Salvar chave'}
      </Button>
    </form>
  );
}
