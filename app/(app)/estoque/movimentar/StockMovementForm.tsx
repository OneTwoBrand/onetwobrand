'use client';

import { useActionState, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Primitives';
import type { CatalogStockItem } from '@/lib/catalog-data';
import { createStockMovement } from './actions';

export function StockMovementForm({ products }: { products: CatalogStockItem[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createStockMovement, {});
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? '');
  const [type, setType] = useState('entrada');

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) ?? products[0],
    [products, selectedId]
  );

  return (
    <form action={formAction} className="space-y-4">
      <Card pad={20}>
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Movimento</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Select name="stock_item_id" label="SKU *" required value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} · {product.size} · {product.color ?? 'sem cor'} · saldo {product.quantity}
              </option>
            ))}
          </Select>
          <Select name="type" label="Tipo *" required value={type} onChange={(event) => setType(event.target.value)}>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="ajuste">Ajuste de saldo</option>
          </Select>
          <Input
            name="qty"
            label={type === 'ajuste' ? 'Novo saldo *' : 'Quantidade *'}
            type="number"
            min={type === 'ajuste' ? 0 : 1}
            required
            placeholder={type === 'ajuste' ? 'Saldo final' : 'Quantidade'}
            hint={selectedProduct ? `Saldo atual: ${selectedProduct.quantity} un.` : undefined}
          />
          <Textarea name="notes" label="Observação" placeholder="Motivo da movimentação, conferência física, troca, reposição..." />
        </div>
      </Card>

      {selectedProduct && (
        <Card pad={18} className="bg-surface">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">SKU selecionado</p>
              <h2 className="mt-1 font-serif text-[20px] font-normal text-ink">{selectedProduct.name}</h2>
              <p className="mt-1 text-[12px] text-ink-soft">
                {selectedProduct.collectionName ?? 'Sem coleção'} · {selectedProduct.category ?? 'peça'} · {selectedProduct.size}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">Saldo</p>
              <p className="font-serif text-[28px] text-ink">{selectedProduct.quantity}</p>
            </div>
          </div>
        </Card>
      )}

      {state?.error && <p className="text-[12px] font-medium text-danger">{state.error}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()} icon={<ArrowLeft size={14} />}>Voltar</Button>
        <Button type="submit" block disabled={pending || products.length === 0} icon={<RotateCw size={14} />}>
          {pending ? 'Salvando...' : 'Registrar'}
        </Button>
      </div>
    </form>
  );
}
