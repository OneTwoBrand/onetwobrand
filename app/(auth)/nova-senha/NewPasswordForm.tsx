'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { updatePasswordFromReset } from '@/app/(auth)/login/actions';

export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordFromReset, {});
  const router = useRouter();

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 size={28} strokeWidth={1.5} className="text-success" />
        </div>
        <p className="text-[13px] text-ink leading-[1.6] max-w-[280px]">
          {state.success} Sua conta está pronta para uso.
        </p>
        <Button
          variant="primary"
          size="lg"
          block
          iconRight={<ArrowRight size={16} />}
          onClick={() => router.push('/')}
          className="mt-2"
        >
          Entrar na plataforma
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <Input
        label="Nova senha"
        name="password"
        type="password"
        icon={<KeyRound size={16} />}
        error={state.error}
        placeholder="Mínimo de 8 caracteres"
        minLength={8}
        required
      />
      <Input
        label="Confirmar nova senha"
        name="confirm"
        type="password"
        icon={<KeyRound size={16} />}
        minLength={8}
        required
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        block
        disabled={pending}
        iconRight={<ArrowRight size={16} />}
        className="mt-1"
      >
        {pending ? 'Salvando…' : 'Definir minha senha'}
      </Button>
    </form>
  );
}
