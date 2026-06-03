/**
 * ONE TWO — Sample Login page
 * Caminho destino: app/(auth)/login/page.tsx
 */
'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import { Mail, Settings, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { signInWithPassword } from './actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInWithPassword, {});

  return (
    <main className="min-h-screen bg-bg flex flex-col px-7 py-8">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3.5">
        <Image src="/one-two-logo.png" alt="ONE TWO" width={150} height={150} priority />
        <h1 className="font-serif text-[26px] leading-[1.25] text-ink mt-4.5 font-light tracking-tight-1 m-0">
          Bem-vinda<br />de volta ao atelier.
        </h1>
        <p className="text-[12px] text-ink-soft max-w-[260px] leading-[1.6] m-0">
          Acompanhe produção, bordagem e estoque do seu ateliê de moda autoral.
        </p>
      </div>

      {/* Form */}
      <form action={formAction} className="flex flex-col gap-3.5">
        <Input
          label="E-mail"
          name="email"
          type="email"
          icon={<Mail size={16} />}
          required
        />
        <Input
          label="Senha"
          name="password"
          type="password"
          icon={<Settings size={16} />}
          error={state.error}
          required
        />
        <a href="/recuperar" className="text-right text-[11px] text-ink-soft tracking-[0.1em] uppercase -mt-1">
          Esqueci minha senha
        </a>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          block
          disabled={pending}
          iconRight={<ArrowRight size={16} />}
          className="mt-3"
        >
          {pending ? 'Entrando...' : 'Entrar'}
        </Button>
        <div className="text-center text-[11px] text-ink-mute mt-2 font-mono">
          v1.0 · made for ONE TWO atelier
        </div>
      </form>
    </main>
  );
}
