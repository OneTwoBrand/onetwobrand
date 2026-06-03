'use client';

import { useActionState } from 'react';
import { CircleDollarSign, PackageCheck, ShoppingCart, UserRound } from 'lucide-react';
import { MultiStepProgress } from '@/components/app/Composites';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { Card, SectionHead } from '@/components/ui/Primitives';
import { brl } from '@/lib/utils';
import type { SaleClientOption, SaleStockOption } from '@/lib/sales-data';
import { createSale } from './actions';

const steps = ['Cliente', 'Peças', 'Qtd', 'Pagto', 'Concluir'];

export function SaleForm({ clients, stock }: { clients: SaleClientOption[]; stock: SaleStockOption[] }) {
  const [state, formAction, pending] = useActionState(createSale, {});

  return (
    <>
      <MultiStepProgress steps={steps} current={5} />
      <form action={formAction} className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <Card pad={22}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <UserRound size={22} />
            </div>
            <SectionHead eyebrow="Passo 1/5" title="Cliente" />
            <Select name="client_id" label="Cliente" required>
              <option value="">Selecione</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </Select>
          </Card>

          <Card pad={22}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <PackageCheck size={22} />
            </div>
            <SectionHead eyebrow="Passos 2 e 3/5" title="Carrinho" />
            <div className="space-y-3">
              {[1, 2, 3].map((index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[1fr_110px]">
                  <Select name={`stock_item_${index}`} label={`Peça ${index}`}>
                    <option value="">Selecione</option>
                    {stock.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.color ?? '-'} · {item.size} · {item.quantity} un. · {brl(item.price)}
                      </option>
                    ))}
                  </Select>
                  <Select name={`qty_${index}`} label="Qtd" defaultValue={index === 1 ? '1' : '0'}>
                    <option value="0">0</option>
                    {Array.from({ length: 12 }, (_, itemIndex) => itemIndex + 1).map((qty) => (
                      <option key={qty} value={qty}>{qty}</option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </Card>

          <Card pad={22}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <CircleDollarSign size={22} />
            </div>
            <SectionHead eyebrow="Passos 4 e 5/5" title="Pagamento" />
            <div className="grid gap-3 md:grid-cols-2">
              <Select name="payment_method" label="Forma" required defaultValue="pix">
                <option value="pix">PIX</option>
                <option value="cash">Dinheiro</option>
                <option value="debit">Débito</option>
                <option value="credit">Crédito</option>
                <option value="installment">Parcelado</option>
              </Select>
              <Select name="status" label="Status" required defaultValue="paid">
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
              </Select>
            </div>
            <Textarea className="mt-3" name="notes" label="Observações" placeholder="Sinal, entrega, ajuste, condição especial..." />
          </Card>

          {state?.error && (
            <p className="rounded-[14px] border border-danger bg-danger-soft px-4 py-3 text-[12px] font-medium text-danger">
              {state.error}
            </p>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="bg-primary text-paper" pad={22}>
            <ShoppingCart size={26} strokeWidth={1.4} />
            <h2 className="m-0 mt-4 font-serif text-[28px] font-normal leading-tight">Venda operacional</h2>
            <p className="mt-3 text-[12px] leading-relaxed text-paper/75">
              Ao salvar como paga, o sistema registra a venda, os itens, atualiza a cliente e baixa o estoque automaticamente.
            </p>
          </Card>
          <Card pad={18}>
            <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Disponível</p>
            <p className="mt-2 font-serif text-[30px] leading-none text-ink">{stock.length}</p>
            <p className="mt-2 text-[12px] text-ink-soft">SKUs com saldo positivo para venda.</p>
          </Card>
          <Button type="submit" block disabled={pending || !clients.length || !stock.length}>
            {pending ? 'Salvando...' : 'Salvar venda'}
          </Button>
        </aside>
      </form>
    </>
  );
}
