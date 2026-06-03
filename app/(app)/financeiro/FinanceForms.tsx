'use client';

import { useActionState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Card, SectionHead } from '@/components/ui/Primitives';
import type { ClientListItem } from '@/lib/app-data';
import { createPayable, createReceivable } from './actions';

export function FinanceForms({ clients }: { clients: ClientListItem[] }) {
  const [payableState, payableAction, payablePending] = useActionState(createPayable, {});
  const [receivableState, receivableAction, receivablePending] = useActionState(createReceivable, {});

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card pad={18}>
        <SectionHead eyebrow="Despesa" title="Nova conta a pagar" />
        <form action={payableAction} className="space-y-3">
          <Input name="supplier" label="Fornecedor/destino" placeholder="Ex: Bordadeira, fornecedor, aluguel" required />
          <div className="grid grid-cols-2 gap-3">
            <Input name="category" label="Categoria" placeholder="fornecedor" />
            <Input name="amount" label="Valor" type="number" min="0" step="0.01" required />
          </div>
          <Input name="due_date" label="Vencimento" type="date" required />
          <Textarea name="notes" label="Observações" />
          {payableState?.error && <p className="text-[12px] font-medium text-danger">{payableState.error}</p>}
          <Button type="submit" size="sm" icon={<Plus size={14} />} disabled={payablePending}>
            {payablePending ? 'Salvando...' : 'Adicionar'}
          </Button>
        </form>
      </Card>

      <Card pad={18}>
        <SectionHead eyebrow="Receita" title="Nova conta a receber" />
        <form action={receivableAction} className="space-y-3">
          <Select name="client_id" label="Cliente" required>
            <option value="">Selecione</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input name="amount" label="Valor" type="number" min="0" step="0.01" required />
            <Input name="due_date" label="Vencimento" type="date" required />
          </div>
          {receivableState?.error && <p className="text-[12px] font-medium text-danger">{receivableState.error}</p>}
          <Button type="submit" size="sm" icon={<Plus size={14} />} disabled={receivablePending}>
            {receivablePending ? 'Salvando...' : 'Adicionar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
