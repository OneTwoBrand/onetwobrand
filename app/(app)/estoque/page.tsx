import { Package, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Primitives';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';
import { brl } from '@/lib/utils';

type ProductItem = {
  id: string;
  name: string;
  color: string | null;
  photo_url?: string | null;
  size: string;
  quantity: number;
  price: number;
};

const fallbackProducts: ProductItem[] = [
  { id: 'vestido-lis', name: 'Vestido Lis', color: 'Linho cru', size: 'M', quantity: 8, price: 890 },
  { id: 'blusa-iris', name: 'Blusa Íris', color: 'Crepe terracota', size: 'P', quantity: 5, price: 420 },
  { id: 'conjunto-hera', name: 'Conjunto Hera', color: 'Off-white', size: 'Único', quantity: 3, price: 1240 },
  { id: 'saia-margarida', name: 'Saia Margarida', color: 'Rosé', size: 'G', quantity: 12, price: 380 },
];

async function getProducts(): Promise<{ products: ProductItem[]; source: 'supabase' | 'fallback' }> {
  if (!hasSupabasePublicEnv()) return { products: fallbackProducts, source: 'fallback' };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('stock_items')
      .select('id, size, color, quantity, pieces(name, price, photo_url)')
      .order('updated_at', { ascending: false });
    if (error || !data?.length) return { products: fallbackProducts, source: 'fallback' };
    return {
      products: data.map((item) => {
        const piece = Array.isArray(item.pieces) ? item.pieces[0] : item.pieces;
        return {
          id: item.id,
          name: piece?.name ?? 'Produto',
          color: item.color,
          photo_url: piece?.photo_url,
          size: item.size,
          quantity: item.quantity,
          price: Number(piece?.price ?? 0),
        };
      }),
      source: 'supabase',
    };
  } catch {
    return { products: fallbackProducts, source: 'fallback' };
  }
}

export default async function EstoquePage() {
  const { products, source } = await getProducts();
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
                  {product.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.photo_url} alt={product.name} className="h-full w-full rounded-[14px] object-cover" />
                  ) : (
                    <Package size={28} strokeWidth={1.4} />
                  )}
                </div>
                <h2 className="m-0 font-serif text-[18px] font-normal text-ink leading-tight">{product.name}</h2>
                <p className="mt-1 text-[11px] text-ink-soft">{product.color ?? '—'} · {product.size}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-ink-soft">{product.quantity} un.</span>
                  {product.quantity <= 3 && <Badge tone="warning" size="sm">Baixo</Badge>}
                </div>
                {product.price > 0 && (
                  <p className="mt-1 font-serif text-[15px] text-ink">{brl(product.price)}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
