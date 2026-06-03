'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { updatePasswordFromReset } from '@/app/(auth)/login/actions';

export default function NovaSenhaPage() {
  const [state, formAction, pending] = useActionState(updatePasswordFromReset, {});
  const router = useRouter();

  return (
    <main className="min-h-screen bg-bg flex flex-col px-7 py-8">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3.5">
        <Image src="/one-two-logo.png" alt="ONE TWO" width={110} height={110} priority />
        <h1 className="font-serif text-[24px] leading-[1.25] text-ink mt-4 font-light tracking-tight-1 m-0">
          Nova senha
        </h1>
        <p className="text-[12px] text-ink-soft max-w-[260px] leading-[1.6] m-0">
          Escolha uma nova senha para acessar a plataforma.
        </p>
      </div>

      {/* Form / success */}
      <div className="flex flex-col gap-3.5">
        {state.success ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 size={28} strokeWidth={1.5} className="text-success" />
            </div>
            <p className="text-[13px] text-ink leading-[1.6] max-w-[280px]">
              {state.success}
            </p>
            <Button
              variant="primary"
              size="lg"
              block
              iconRight={<ArrowRight size={16} />}
              onClick={() => router.push('/login')}
              className="mt-2"
            >
              Ir para o login
            </Button>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-3.5">
            <Input
              label="Nova senha"
              name="password"
              type="password"
              icon={<KeyRound size={16} />}
              error={state.error}
              required
            />
            <Input
              label="Confirmar nova senha"
              name="confirm"
              type="password"
              icon={<KeyRound size={16} />}
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
              {pending ? 'Salvando…' : 'Definir nova senha'}
            </Button>
          </form>
        )}

        <div className="text-center text-[11px] text-ink-mute mt-4 font-mono">
          v1.0 · Desenvolvido por Girassol Inteligência
        </div>
      </div>
    </main>
  );
}
