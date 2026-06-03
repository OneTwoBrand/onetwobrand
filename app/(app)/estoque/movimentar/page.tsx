import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Badge } from '@/components/ui/Badge';
import { getCatalogStock } from '@/lib/catalog-data';
import { StockMovementForm } from './StockMovementForm';

export default async function MovimentarEstoquePage() {
  const { products, source } = await getCatalogStock();

  return (
    <>
      <AppBar title="Movimentar Estoque" back />
      <Topbar eyebrow="Estoque" title="Movimentar Estoque" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <div className="mx-auto max-w-3xl">
          {source === 'fallback' && (
            <div className="mb-4 flex items-center justify-between rounded-[14px] border border-line bg-paper px-4 py-3">
              <p className="text-[12px] text-ink-soft">Dados demonstrativos — faça login para movimentar estoque real.</p>
              <Badge tone="warning" size="sm">Fallback</Badge>
            </div>
          )}
          <StockMovementForm products={products} />
        </div>
      </main>
    </>
  );
}
