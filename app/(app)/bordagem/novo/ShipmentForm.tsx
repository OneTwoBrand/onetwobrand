'use client';

import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Primitives';
import type { ProductionOrderListItem } from '@/lib/production/orders';
import { createShipment } from './actions';

export function ShipmentForm({ orders }: { orders: ProductionOrderListItem[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createShipment, {});

  return (
    <>
      <AppBar title="Nova Bordagem" back onBack={() => router.back()} />
      <Topbar eyebrow="Bordagem" title="Nova Bordagem" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <div className="mx-auto max-w-xl">
          <form action={formAction} className="space-y-4">
            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Remessa</p>
              <div className="space-y-3">
                <Input name="code" label="Código da remessa *" placeholder="Ex: BD-119" required />
                <Input name="seamstress_name" label="Costureira *" placeholder="Ex: Maria Helena" required />
                <Input name="embroidery_type" label="Tipo de bordagem" placeholder="Ex: Ponto cruz, Richelieu…" />
                <Input name="qty" label="Quantidade de peças *" type="number" min="1" placeholder="0" required />
                <Select name="op_id" label="Vincular OP">
                  <option value="">Sem vínculo</option>
                  {orders.map((order) => (
                    <option key={order.id ?? order.opNumber} value={order.id ?? ''}>
                      OP {order.opNumber} · {order.productName} · {order.clientName}
                    </option>
                  ))}
                </Select>
              </div>
            </Card>
            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Datas e valor</p>
              <div className="space-y-3">
                <Input name="sent_at" label="Data de envio *" type="date" required />
                <Input name="expected_return_at" label="Previsão de retorno *" type="date" required />
                <Input name="value" label="Valor combinado (R$)" type="number" step="0.01" placeholder="0,00" />
              </div>
            </Card>
            {state?.error && <p className="text-[12px] font-medium text-danger">{state.error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => router.back()} icon={<ChevronLeft size={14} />}>Voltar</Button>
              <Button type="submit" block disabled={pending}>{pending ? 'Salvando...' : 'Salvar bordagem'}</Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
