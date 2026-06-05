'use client';

import { useRouter } from 'next/navigation';
import { use, useActionState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { PhoneInput, PixKeyInput } from '@/components/ui/MaskedInput';
import { Card } from '@/components/ui/Primitives';
import { updateSeamstress } from '../../actions';

export default function EditarCostureiraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateSeamstress, {});

  return (
    <>
      <AppBar title="Editar costureira" back onBack={() => router.back()} />
      <Topbar eyebrow="Costureiras" title="Editar costureira" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <form action={formAction} className="mx-auto max-w-xl space-y-4">
          <input type="hidden" name="id" value={id} />
          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Dados da costureira</p>
            <div className="space-y-3">
              <Input name="name" label="Nome *" placeholder="Ex: Maria Helena" required />
              <Select name="role" label="Função" defaultValue="Costureira">
                <option>Costureira</option>
                <option>Costureira-chefe</option>
                <option>Bordadeira</option>
                <option>Atelier · QA</option>
              </Select>
              <PhoneInput name="phone" label="Telefone" placeholder="(67) 9 0000-0000" />
              <PixKeyInput name="pix" label="Chave PIX" />
              <Input name="specialty" label="Especialidade" placeholder="Bordado floral, costura fina..." />
              <Textarea name="address" label="Endereço" />
              <Textarea name="notes" label="Observações" />
              <Select name="active" label="Status">
                <option value="true">Ativa</option>
                <option value="false">Inativa</option>
              </Select>
            </div>
          </Card>
          {state?.error && <p className="text-[12px] font-medium text-danger">{state.error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()} icon={<ChevronLeft size={14} />}>
              Voltar
            </Button>
            <Button type="submit" block disabled={pending}>
              {pending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}
