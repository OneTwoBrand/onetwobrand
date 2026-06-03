import { Package, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Primitives';
import { getCatalogStock } from '@/lib/catalog-data';
import { brl } from '@/lib/utils';

export default async function EstoquePage() {
  const { products, source } = await getCatalogStock();
  const totalQty = products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <>
      <AppBar
        large
        eyebrow="Estoque"
        title={`${totalQty} peças · ${products.length} SKUs`}
        action={<Link href="/estoque/novo"><Button size="sm" icon={<Plus size={14} />}>Novo</Button></Link>}
      />
      <Topbar
        eyebrow="Estoque"
        title={`${totalQty} peças · ${products.length} SKUs`}
        action={<Link href="/estoque/novo"><Button size="sm" icon={<Plus size={14} />}>Novo produto</Button></Link>}
      />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <div className="mx-auto max-w-5xl">
          {source === 'fallback' && (
            <div className="mb-4 flex items-center justify-between rounded-[14px] border border-line bg-paper px-4 py-3">
              <p className="text-[12px] text-ink-soft">Dados demonstrativos — faça login para carregar o estoque real.</p>
              <Badge tone="warning" size="sm">Fallback</Badge>
            </div>
          )}
          <div className="mb-4 flex h-12 items-center gap-3 rounded-[14px] border border-line bg-paper px-4 text-ink-soft">
            <Search size={16} strokeWidth={1.5} />
            <span className="text-[13px]">Buscar produto, coleção ou cor</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {products.map((product) => (
              <Card key={product.id} pad={14}>
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
        </div>
      </main>
    </>
  );
}
