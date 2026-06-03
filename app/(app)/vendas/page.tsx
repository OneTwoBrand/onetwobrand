import Link from 'next/link';
import { Plus, ShoppingCart } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { DataNotice } from '@/components/app/DataNotice';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, SectionHead } from '@/components/ui/Primitives';
import { getSalesSummary } from '@/lib/app-data';
import { brl } from '@/lib/utils';

export default async function VendasPage() {
  const { summary, source, error } = await getSalesSummary();

  return (
    <>
      <AppBar large eyebrow="Vendas" title={`${summary.pendingOrders} pedidos pendentes`} action={<Link href="/vendas/novo"><Button size="sm" icon={<Plus size={14} />}>Nova</Button></Link>} />
      <Topbar eyebrow="Vendas" title="Fluxo de vendas" action={<Link href="/vendas/novo"><Button size="sm" icon={<Plus size={14} />}>Nova venda</Button></Link>} />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-5xl">
          <DataNotice source={source} error={error} />
          <Card className="mb-5 bg-primary text-paper" pad={22}>
            <ShoppingCart size={28} strokeWidth={1.4} />
            <h1 className="m-0 mt-4 font-serif text-[34px] font-normal leading-[1.05]">Nova venda em 5 passos</h1>
            <p className="mt-3 text-[12px] leading-relaxed text-paper/75">Cliente, peças, quantidade, pagamento e conclusão em fluxo mobile-first.</p>
            <Link href="/vendas/novo"><Button className="mt-5" variant="secondary" size="sm">Iniciar venda</Button></Link>
          </Card>
          <SectionHead eyebrow="Histórico" title="Últimas vendas" />
          <div className="grid gap-3 md:grid-cols-2">
            {summary.latestSales.length ? summary.latestSales.map((sale) => (
              <Card key={sale.id} pad={16}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="m-0 font-serif text-[18px] font-normal text-ink">{sale.clientName}</h2>
                    <p className="mt-1 text-[11px] text-ink-soft">{sale.createdAt}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={sale.status === 'paid' ? 'success' : 'warning'} size="sm">{sale.status}</Badge>
                    <p className="mt-2 text-[13px] font-medium text-ink">{brl(sale.total)}</p>
                  </div>
                </div>
              </Card>
            )) : (
              <Card pad={18}>
                <p className="m-0 text-[13px] text-ink-soft">Nenhuma venda registrada ainda.</p>
              </Card>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
