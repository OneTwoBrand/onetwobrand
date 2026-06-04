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
import type { SeamstressListItem } from '@/lib/app-data';
import { createShipment } from './actions';

export function ShipmentForm({
  orders,
  seamstresses,
  shipmentCodes,
  nextCode,
  embroideryTypes,
}: {
  orders: ProductionOrderListItem[];
  seamstresses: SeamstressListItem[];
  shipmentCodes: string[];
  nextCode: string;
  embroideryTypes: string[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createShipment, {});
  const recentCodes = shipmentCodes
    .filter((code) => /^BD-\d+$/i.test(code))
    .sort((a, b) => Number(b.replace(/\D/g, '')) - Number(a.replace(/\D/g, '')))
    .slice(0, 3);
  const noSeamstresses = seamstresses.length === 0;

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
                <Input
                  label="Código da remessa *"
                  value={nextCode}
                  readOnly
                  hint={recentCodes.length ? `Gerado automaticamente. Últimas remessas: ${recentCodes.join(', ')}.` : 'Gerado automaticamente pela plataforma.'}
                />
                <Select name="seamstress_id" label="Costureira *" required disabled={noSeamstresses}>
                  <option value="">{noSeamstresses ? 'Cadastre uma costureira primeiro' : 'Selecione'}</option>
                  {seamstresses.map((seamstress) => (
                    <option key={seamstress.id} value={seamstress.id}>
                      {seamstress.name}
                    </option>
                  ))}
                </Select>
                <Select name="embroidery_type" label="Tipo de bordagem">
                  <option value="">Selecione</option>
                  {embroideryTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
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
              <Button type="submit" block disabled={pending || noSeamstresses}>{pending ? 'Salvando...' : 'Salvar bordagem'}</Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
