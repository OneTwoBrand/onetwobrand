'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/MaskedInput';
import { Select, Textarea } from '@/components/ui/Field';
import { Card } from '@/components/ui/Primitives';
import { updateClient } from '../../novo/actions';
import type { ClientDetail } from '@/lib/app-data';

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

export function EditClientForm({ client }: { client: ClientDetail }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateClient, {});

  return (
    <>
      <AppBar title="Editar cliente" back onBack={() => router.back()} />
      <Topbar eyebrow="Clientes" title="Editar cliente" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <form action={formAction} className="mx-auto max-w-xl space-y-4">
          <input type="hidden" name="id" value={client.id} />

          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-wide-2 text-ink-soft">Dados pessoais</p>
            <div className="space-y-3">
              <Input
                name="name"
                label="Nome completo *"
                defaultValue={client.name}
                placeholder="Ex: Clara Bianchi"
                required
              />
              <PhoneInput
                name="phone"
                label="Telefone / WhatsApp"
                defaultValue={client.phone ?? ''}
                placeholder="(67) 9 0000-0000"
              />
              <Input
                name="email"
                label="E-mail"
                type="email"
                defaultValue={client.email ?? ''}
                placeholder="nome@email.com"
              />
            </div>
          </Card>

          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-wide-2 text-ink-soft">Localização</p>
            <div className="grid grid-cols-2 gap-3">
              <Input name="city" label="Cidade" defaultValue={client.city ?? ''} placeholder="São Paulo" />
              <Select name="state" label="Estado" defaultValue={client.state ?? ''}>
                <option value="">—</option>
                {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </Select>
            </div>
          </Card>

          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-wide-2 text-ink-soft">Anotações</p>
            <Textarea
              name="notes"
              label="Observações"
              defaultValue={client.notes ?? ''}
              placeholder="Preferências, histórico, detalhes relevantes..."
              rows={4}
            />
          </Card>

          {state?.error && <p className="text-[12px] font-medium text-danger">{state.error}</p>}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              icon={<ChevronLeft size={14} />}
            >
              Voltar
            </Button>
            <Button type="submit" block disabled={pending} iconRight={<Check size={14} />}>
              {pending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}
