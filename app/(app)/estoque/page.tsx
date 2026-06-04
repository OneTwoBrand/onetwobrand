import { ArrowDown, ArrowUp, History, Package, Plus, RotateCw, Search, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, SectionHead } from '@/components/ui/Primitives';
import { getCatalogStock } from '@/lib/catalog-data';
import { getStockMovements, type StockMovementItem, type StockMovementType } from '@/lib/stock-data';
import { brl } from '@/lib/utils';
import { DeleteStockItemButton } from './DeleteStockItemButton';

export default async function EstoquePage() {
  const [{ products, source }, { movements }] = await Promise.all([
    getCatalogStock(),
    getStockMovements(10),
  ]);
  const totalQty = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStock = products.filter((product) => product.quantity <= product.lowThreshold).length;
  const stockCost = products.reduce((sum, product) => sum + product.quantity * product.costPrice, 0);
  const stockValue = products.reduce((sum, product) => sum + product.quantity * product.price, 0);
  const action = (
    <div className="flex gap-2">
      <Link href="/estoque/movimentar"><Button size="sm" variant="soft" icon={<SlidersHorizontal size={14} />}>Mov.</Button></Link>
      <Link href="/estoque/novo"><Button size="sm" icon={<Plus size={14} />}>Novo</Button></Link>
    </div>
  );

  return (
    <>
      <AppBar
        large
        eyebrow="Estoque"
        title={`${totalQty} peças · ${products.length} SKUs`}
        action={action}
      />
      <Topbar
        eyebrow="Estoque"
        title={`${totalQty} peças · ${products.length} SKUs`}
        action={action}
      />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <div className="mx-auto max-w-5xl">
          {source === 'fallback' && (
            <div className="mb-4 flex items-center justify-between rounded-[14px] border border-line bg-paper px-4 py-3">
              <p className="text-[12px] text-ink-soft">Dados demonstrativos — faça login para carregar o estoque real.</p>
              <Badge tone="warning" size="sm">Fallback</Badge>
            </div>
          )}
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <StockMetric label="Peças" value={totalQty.toString()} />
            <StockMetric label="SKUs baixos" value={lowStock.toString()} tone={lowStock > 0 ? 'warning' : 'success'} />
            <StockMetric label="Custo em estoque" value={brl(stockCost)} />
            <StockMetric label="Valor potencial" value={brl(stockValue)} />
          </div>
          <div className="mb-4 flex h-12 items-center gap-3 rounded-[14px] border border-line bg-paper px-4 text-ink-soft">
            <Search size={16} strokeWidth={1.5} />
            <span className="text-[13px]">Buscar produto, coleção ou cor</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {products.map((product) => (
              <Card key={product.id} pad={14}>
                <div className="mb-2 flex justify-end">
                  <DeleteStockItemButton stockItemId={product.id} pieceId={product.pieceId} name={product.name} />
                </div>
                <div className="mb-3 flex aspect-[4/5] items-center justify-center rounded-[14px] border border-line bg-surface text-primary">
                  {product.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.photoUrl} alt={product.name} className="h-full w-full rounded-[14px] object-cover" />
                  ) : (
                    <Package size={28} strokeWidth={1.4} />
                  )}
                </div>
                <h2 className="m-0 font-serif text-[18px] font-normal text-ink leading-tight">{product.name}</h2>
                <p className="mt-1 text-[11px] text-ink-soft">{product.collectionName ?? 'Sem coleção'} · {product.category ?? 'peça'}</p>
                <p className="mt-1 text-[11px] text-ink-soft">{product.color ?? product.fabric ?? '—'} · {product.size}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-ink-soft">{product.quantity} un.</span>
                  {product.quantity <= product.lowThreshold && <Badge tone="warning" size="sm">Baixo</Badge>}
                </div>
                {product.price > 0 && (
                  <p className="mt-1 font-serif text-[15px] text-ink">{brl(product.price)}</p>
                )}
                {product.costPrice > 0 && <p className="mt-1 text-[10px] text-ink-soft">Custo {brl(product.costPrice)}</p>}
              </Card>
            ))}
          </div>

          <section className="mt-8">
            <SectionHead eyebrow="Auditoria" title="Últimas movimentações" action={<History size={18} className="text-ink-soft" />} />
            <div className="space-y-3">
              {movements.length > 0 ? movements.map((movement) => (
                <MovementRow key={movement.id} movement={movement} />
              )) : (
                <Card pad={18}>
                  <p className="text-[13px] text-ink-soft">Nenhuma movimentação registrada ainda.</p>
                </Card>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function StockMetric({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'success' | 'warning' }) {
  return (
    <Card pad={16}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft">{label}</p>
          <p className="mt-1 font-serif text-[24px] text-ink">{value}</p>
        </div>
        {tone !== 'neutral' && <Badge tone={tone} size="sm">{tone === 'success' ? 'OK' : 'Atenção'}</Badge>}
      </div>
    </Card>
  );
}

function MovementRow({ movement }: { movement: StockMovementItem }) {
  const delta = movement.resultingQty - movement.previousQty;
  const isPositive = delta > 0;

  return (
    <Card pad={16}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-primary">
          <MovementIcon type={movement.type} positive={isPositive} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 font-serif text-[18px] font-normal text-ink">{movement.pieceName}</h3>
            <Badge tone={movementTone(movement.type)} size="sm">{movementLabel(movement.type)}</Badge>
          </div>
          <p className="mt-1 text-[12px] text-ink-soft">
            {movement.size ?? 'Único'} · {movement.color ?? 'sem cor'} · {movementDate(movement.createdAt)}
          </p>
          {movement.notes && <p className="mt-2 text-[12px] text-ink-soft">{movement.notes}</p>}
        </div>
        <div className="text-right">
          <p className="font-serif text-[22px] text-ink">{isPositive ? '+' : delta < 0 ? '-' : ''}{movement.qty}</p>
          <p className="text-[11px] text-ink-soft">{movement.previousQty} → {movement.resultingQty}</p>
        </div>
      </div>
    </Card>
  );
}

function MovementIcon({ type, positive }: { type: StockMovementType; positive: boolean }) {
  if (type === 'entrada' || positive) return <ArrowUp size={18} />;
  if (type === 'saida' || type === 'venda') return <ArrowDown size={18} />;
  return <RotateCw size={18} />;
}

function movementTone(type: StockMovementType): 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
  if (type === 'entrada' || type === 'producao') return 'success';
  if (type === 'saida' || type === 'venda') return 'danger';
  if (type === 'ajuste') return 'warning';
  return 'neutral';
}

function movementLabel(type: StockMovementType) {
  const labels: Record<StockMovementType, string> = {
    entrada: 'Entrada',
    saida: 'Saída',
    ajuste: 'Ajuste',
    producao: 'Produção',
    venda: 'Venda',
  };
  return labels[type];
}

function movementDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date));
}
