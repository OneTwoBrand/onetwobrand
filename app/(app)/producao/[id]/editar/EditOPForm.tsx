'use client';

import { use, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, Textarea } from '@/components/ui/Field';
import { Card } from '@/components/ui/Primitives';
import { editProductionOrder } from '../actions';
import type { ProductionOrderDetail } from '@/lib/production/orders';

type Props = {
  params: Promise<{ id: string }>;
  order: ProductionOrderDetail;
  seamstresses: { id: string; name: string }[];
  allStatuses: string[];
  embroideryTypes: string[];
};

export function EditOPForm({ params, order, seamstresses, allStatuses }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(editProductionOrder, { error: '' });

  const productName = order.productName.includes(' — ')
    ? order.productName.split(' — ')[0]
    : order.productName;

  return (
    <>
      <AppBar title={`Editar OP ${order.opNumber}`} back onBack={() => router.back()} />
      <Topbar eyebrow="Produção" title={`Editar OP #${order.opNumber}`} />

      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <form action={formAction} className="mx-auto max-w-xl space-y-4">
          <input type="hidden" name="opId" value={id} />

          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-wide-2 text-ink-soft">
              Dados da produção
            </p>
            <div className="space-y-3">
              <Input
                name="productName"
                label="Produto"
                defaultValue={productName}
                placeholder="Ex: Vestido Lis"
                required
              />
              <Input
                name="clientName"
                label="Cliente"
                defaultValue={order.clientName}
                placeholder="Nome do cliente"
                required
              />
              {seamstresses.length > 0 ? (
                <Select
                  name="seamstressName"
                  label="Costureira"
                  defaultValue={order.seamstressName ?? ''}
                >
                  <option value="">— Não atribuída —</option>
                  {seamstresses.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </Select>
              ) : (
                <Input
                  name="seamstressName"
                  label="Costureira"
                  defaultValue={order.seamstressName ?? ''}
                  placeholder="Nome da costureira"
                />
              )}
              <Select
                name="status"
                label="Status"
                defaultValue={order.status}
              >
                {allStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <Input
                name="qty"
                label="Quantidade"
                type="number"
                min={1}
                defaultValue={order.qty}
              />
              <Input
                name="dueDate"
                label="Prazo"
                type="date"
                defaultValue={order.dueDate}
              />
              <Input
                name="fabricUsed"
                label="Tecido / Modelo"
                defaultValue={order.fabricUsed ?? ''}
                placeholder="Linho cru, crepe, algodão..."
              />
              <Textarea
                name="embroideryNotes"
                label="Observações / Bordagem"
                defaultValue={order.embroideryNotes ?? ''}
                placeholder="Detalhes de acabamento, bordagem, prova ou entrega."
                rows={4}
              />
            </div>
          </Card>

          {state?.error && (
            <p className="text-[12px] font-medium text-danger">{state.error}</p>
          )}

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
