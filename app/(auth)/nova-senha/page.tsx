import Image from 'next/image';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';
import { parsePasswordFlow } from '@/lib/auth-flow';
import { Button } from '@/components/ui/Button';
import { NewPasswordForm } from './NewPasswordForm';
import { ImplicitSessionBridge } from './ImplicitSessionBridge';

type PageProps = {
  searchParams: Promise<{ error?: string; flow?: string }>;
};

export default async function NovaSenhaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const flow = parsePasswordFlow(params.flow ?? null);
  let hasValidSession = false;

  if (hasSupabasePublicEnv() && !params.error) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    hasValidSession = Boolean(user && flow);
  }

  const isInvite = flow === 'invite';

  return (
    <main className="min-h-screen bg-bg flex flex-col px-7 py-8">
      <ImplicitSessionBridge />
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3.5">
        <Image src="/one-two-logo.png" alt="ONE TWO" width={110} height={110} priority />
        <h1 className="font-serif text-[24px] leading-[1.25] text-ink mt-4 font-light tracking-tight-1 m-0">
          {hasValidSession ? (isInvite ? 'Crie sua senha' : 'Nova senha') : 'Link inválido ou expirado'}
        </h1>
        <p className="text-[12px] text-ink-soft max-w-[280px] leading-[1.6] m-0">
          {hasValidSession
            ? isInvite
              ? 'Para ativar sua conta, escolha uma senha de acesso.'
              : 'Escolha uma nova senha para acessar a plataforma.'
            : 'Este link não pode mais ser utilizado. Solicite um novo convite ao administrador ou redefina sua senha.'}
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        {hasValidSession ? (
          <NewPasswordForm />
        ) : (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-danger-soft flex items-center justify-center">
              <AlertCircle size={28} strokeWidth={1.5} className="text-danger" />
            </div>
            <Link href="/recuperar" className="w-full">
              <Button variant="primary" size="lg" block iconRight={<ArrowRight size={16} />}>
                Redefinir minha senha
              </Button>
            </Link>
            <Link href="/login" className="text-[11px] text-ink-soft tracking-[0.1em] uppercase">
              Voltar ao login
            </Link>
          </div>
        )}

        <div className="text-center text-[11px] text-ink-mute mt-4">
          Desenvolvido por Girassol Inteligência para OneTwoBrand
        </div>
      </div>
    </main>
  );
}
