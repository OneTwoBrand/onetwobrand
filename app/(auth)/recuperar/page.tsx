'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { sendPasswordReset } from '@/app/(auth)/login/actions';

export default function RecuperarPage() {
  const [state, formAction, pending] = useActionState(sendPasswordReset, {});

  return (
    <main className="min-h-screen bg-bg flex flex-col px-7 py-8">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3.5">
        <Image src="/one-two-logo.png" alt="ONE TWO" width={110} height={110} priority />
        <h1 className="font-serif text-[24px] leading-[1.25] text-ink mt-4 font-light tracking-tight-1 m-0">
          Recuperar acesso
        </h1>
        <p className="text-[12px] text-ink-soft max-w-[260px] leading-[1.6] m-0">
          Informe seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
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
            <p className="text-[11px] text-ink-soft leading-[1.6] max-w-[260px]">
              Verifique também sua caixa de spam.
            </p>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-3.5">
            <Input
              label="E-mail"
              name="email"
              type="email"
              icon={<Mail size={16} />}
              error={state.error}
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
              {pending ? 'Enviando…' : 'Enviar link de recuperação'}
            </Button>
          </form>
        )}

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-[11px] text-ink-soft tracking-[0.1em] uppercase mt-2"
        >
          <ArrowLeft size={12} strokeWidth={2} />
          Voltar ao login
        </Link>

        <div className="text-center text-[11px] text-ink-mute mt-2">
          Desenvolvido por Girassol Inteligência para OneTwoBrand
        </div>
      </div>
    </main>
  );
}
