'use client';

import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MaskedInput';
import { Card } from '@/components/ui/Primitives';
import { updateShipment } from '../../novo/actions';

type Shipment = {
  id: string;
  code: string;
  seamstress_id: string;
  embroidery_type: string | null;
  qty: number;
  sent_at: string;
  expected_return_at: string;
  value: number;
  status: string;
};

export function EditarRemessaForm({
  shipment,
  seamstresses,
  embroideryTypes,
}: {
  shipment: Shipment;
  seamstresses: { id: string; name: string }[];
  embroideryTypes: string[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateShipment, {});

  const valueFormatted = shipment.value
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(shipment.value)
    : '';

  return (
    <>
      <AppBar title="Editar remessa" back onBack={() => router.back()} />
      <Topbar eyebrow="Bordagem" title="Editar remessa" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <form action={formAction} className="mx-auto max-w-xl space-y-4">
          <input type="hidden" name="id" value={shipment.id} />
          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Remessa</p>
            <div className="space-y-3">
              <Input
                label="Código da remessa"
                value={shipment.code}
                readOnly
                hint="O código não pode ser alterado."
              />
              <Select name="seamstress_id" label="Costureira *" required defaultValue={shipment.seamstress_id}>
                <option value="">Selecione</option>
                {seamstresses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
              <Select name="embroidery_type" label="Tipo de bordagem" defaultValue={shipment.embroidery_type ?? ''}>
                <option value="">Selecione</option>
                {embroideryTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <Input
                name="qty"
                label="Quantidade de peças *"
                type="number"
                min="1"
                required
                defaultValue={shipment.qty}
              />
            </div>
          </Card>
          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Datas e valor</p>
            <div className="space-y-3">
              <Input name="sent_at" label="Data de envio *" type="date" required defaultValue={shipment.sent_at} />
              <Input name="expected_return_at" label="Previsão de retorno *" type="date" required defaultValue={shipment.expected_return_at} />
              <MoneyInput name="value" label="Valor combinado" placeholder="R$ 0,00" defaultValue={valueFormatted} />
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
