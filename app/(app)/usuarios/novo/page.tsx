'use client';

import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Primitives';
import { inviteUser } from '../actions';

export default function NovoUsuarioPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(inviteUser, {});

  return (
    <>
      <AppBar title="Convidar usuário" back onBack={() => router.back()} />
      <Topbar eyebrow="Usuários" title="Convidar usuário" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <div className="mx-auto max-w-xl">
          <form action={formAction} className="space-y-4">
            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">
                Dados do convite
              </p>
              <div className="space-y-3">
                <Input name="full_name" label="Nome completo *" placeholder="Ex: Maria Helena" required />
                <Input name="email" label="E-mail *" type="email" placeholder="nome@email.com" required />
              </div>
            </Card>

            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">
                Função na plataforma
              </p>
              <div className="space-y-2">
                {[
                  { value: 'atelier',   label: 'Atelier',      desc: 'Acesso completo aos módulos operacionais. Pode criar, editar e excluir registros.' },
                  { value: 'vendedora', label: 'Vendedora',    desc: 'Acesso ao módulo de negociações WhatsApp. Ideal para quem atende clientes direto.' },
                  { value: 'viewer',    label: 'Visualizador', desc: 'Somente leitura. Não pode criar nem alterar registros.' },
                  { value: 'admin',     label: 'Admin',        desc: 'Acesso total incluindo gestão de usuários e configurações de TI.' },
                ].map((opt) => (
                  <label key={opt.value} className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-line p-3 hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary-soft/30 transition-colors">
                    <input type="radio" name="role" value={opt.value} defaultChecked={opt.value === 'atelier'} className="mt-0.5 accent-primary" />
                    <div>
                      <p className="text-[13px] font-medium text-ink">{opt.label}</p>
                      <p className="mt-0.5 text-[11px] text-ink-soft">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
            {state?.success && (
              <div className="rounded-[12px] bg-success-soft px-4 py-3 text-[12px] text-success">
                {state.success} O usuário receberá um e-mail para criar sua senha.
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => router.back()} icon={<ChevronLeft size={14} />}>
                Voltar
              </Button>
              <Button type="submit" block disabled={pending || Boolean(state?.success)}>
                {pending ? 'Enviando convite…' : 'Enviar convite'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
