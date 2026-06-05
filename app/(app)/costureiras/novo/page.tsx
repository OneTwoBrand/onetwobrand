'use client';

import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/MaskedInput';
import { Card } from '@/components/ui/Primitives';
import { createSeamstress } from '../actions';

export default function NovaCostureiraPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createSeamstress, {});

  return (
    <>
      <AppBar title="Nova costureira" back onBack={() => router.back()} />
      <Topbar eyebrow="Costureiras" title="Nova costureira" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <form action={formAction} className="mx-auto max-w-xl space-y-4">
          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Cadastro</p>
            <div className="space-y-3">
              <Input name="name" label="Nome *" placeholder="Ex: Maria Helena" required />
              <Select name="role" label="Função" defaultValue="Costureira">
                <option>Costureira</option>
                <option>Costureira-chefe</option>
                <option>Bordadeira</option>
                <option>Atelier · QA</option>
              </Select>
              <PhoneInput name="phone" label="Telefone" placeholder="(67) 9 0000-0000" />
              <Input name="pix" label="PIX" placeholder="chave pix" />
              <Input name="specialty" label="Especialidade" placeholder="Bordado floral, costura fina..." />
              <Textarea name="address" label="Endereço" />
              <Textarea name="notes" label="Observações" />
            </div>
          </Card>
          {state?.error && <p className="text-[12px] font-medium text-danger">{state.error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()} icon={<ChevronLeft size={14} />}>Voltar</Button>
            <Button type="submit" block disabled={pending}>{pending ? 'Salvando...' : 'Salvar costureira'}</Button>
          </div>
        </form>
      </main>
    </>
  );
}
