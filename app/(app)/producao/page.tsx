import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { OPRow } from '@/components/app/Composites';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getProductionOrders } from '@/lib/production/orders';

export default async function ProducaoPage() {
  const { orders, source, error } = await getProductionOrders();
  const title = `${orders.length} ordens ativas`;

  return (
    <>
      <AppBar
        large
        eyebrow="Produção"
        title={title}
        action={<Link href="/producao/novo"><Button size="sm" icon={<Plus size={14} />}>Nova</Button></Link>}
      />
      <Topbar
        eyebrow="Produção"
        title={title}
        action={<Link href="/producao/novo"><Button size="sm" icon={<Plus size={14} />}>Nova OP</Button></Link>}
      />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex h-12 items-center gap-3 rounded-[14px] border border-line bg-paper px-4 text-ink-soft">
            <Search size={16} strokeWidth={1.5} />
            <span className="text-[13px]">Buscar OP, cliente ou peça</span>
          </div>
          {source === 'fallback' && (
            <div className="mb-4 flex flex-col gap-2 rounded-[14px] border border-line bg-paper px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[12px] font-medium text-ink">Dados demonstrativos em uso</div>
                <div className="mt-1 text-[11px] text-ink-soft">
                  {error ? `Supabase: ${error}` : 'Faça login para carregar OPs reais do Supabase.'}
                </div>
              </div>
              <Badge tone="warning" size="sm">Fallback</Badge>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {orders.map((order) => <OPRow key={order.opNumber} {...order} href={`/producao/${order.opNumber}`} />)}
          </div>
        </div>
      </main>
    </>
  );
}
