'use client';

import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/MaskedInput';
import { Card } from '@/components/ui/Primitives';
import { saveClient } from './actions';

export default function NovaClientePage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveClient, {});

  return (
    <>
      <AppBar title="Nova Cliente" back onBack={() => router.back()} />
      <Topbar eyebrow="Clientes" title="Nova Cliente" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <div className="mx-auto max-w-xl">
          <form action={formAction} className="space-y-4">
            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Dados pessoais</p>
              <div className="space-y-3">
                <Input name="name" label="Nome completo *" placeholder="Ex: Clara Bianchi" required />
                <PhoneInput name="phone" label="Telefone / WhatsApp" placeholder="(67) 9 0000-0000" />
                <Input name="email" label="E-mail" type="email" placeholder="nome@email.com" />
              </div>
            </Card>
            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Localização</p>
              <div className="grid grid-cols-2 gap-3">
                <Input name="city" label="Cidade" placeholder="São Paulo" />
                <Input name="state" label="Estado" placeholder="SP" />
              </div>
            </Card>
            {state?.error && (
              <p className="text-[12px] text-danger">{state.error}</p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => router.back()} icon={<ChevronLeft size={14} />}>
                Voltar
              </Button>
              <Button type="submit" block disabled={pending}>
                {pending ? 'Salvando…' : 'Salvar cliente'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
