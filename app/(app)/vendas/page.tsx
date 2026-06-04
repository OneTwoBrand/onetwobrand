import Link from 'next/link';
import { CircleDollarSign, Clock, Plus, ShoppingBag, ShoppingCart, TrendingUp } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, SectionHead } from '@/components/ui/Primitives';
import { getSalesList } from '@/lib/sales-data';
import { brl } from '@/lib/utils';

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'PIX',
  card: 'Cartão',
  cash: 'Dinheiro',
  transfer: 'Transferência',
  installment: 'Parcelado',
};

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success',
  pending: 'warning',
  cancelled: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  cancelled: 'Cancelado',
};

export default async function VendasPage({ searchParams }: { searchParams: Promise<{ origem?: string }> }) {
  const { origem } = await searchParams;
  const { sales, source } = await getSalesList();

  const filtered = origem === 'loja'
    ? sales.filter((s) => s.orderSource === 'shop')
    : origem === 'atelier'
    ? sales.filter((s) => s.orderSource !== 'shop')
    : sales;

  const shopCount = sales.filter((s) => s.orderSource === 'shop').length;

  const totalRevenue = filtered.filter((s) => s.status === 'paid').reduce((sum, s) => sum + s.total, 0);
  const pending = filtered.filter((s) => s.status === 'pending');
  const pendingTotal = pending.reduce((sum, s) => sum + s.total, 0);

  const newAction = (
    <Link href="/vendas/novo">
      <Button size="sm" icon={<Plus size={14} />}>Nova venda</Button>
    </Link>
  );

  return (
    <>
      <AppBar large eyebrow="Vendas" title={`${filtered.length} vendas`} action={<Link href="/vendas/novo"><Button size="sm" icon={<Plus size={14} />}>Nova</Button></Link>} />
      <Topbar eyebrow="Vendas" title={`${filtered.length} vendas`} action={newAction} />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-5xl space-y-5">

          {/* Filtro por origem */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'Todas', value: undefined },
              { label: 'Atelier', value: 'atelier' },
              { label: 'Loja online', value: 'loja', count: shopCount },
            ].map(({ label, value, count }) => {
              const active = (origem ?? undefined) === value;
              const href = value ? `/vendas?origem=${value}` : '/vendas';
              return (
                <Link
                  key={label}
                  href={href}
                  className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-medium tracking-[0.12em] uppercase transition-colors ${
                    active
                      ? 'bg-primary text-paper'
                      : 'bg-ink/6 text-ink hover:bg-ink/10'
                  }`}
                >
                  {label === 'Loja online' && <ShoppingBag size={11} />}
                  {label}
                  {count !== undefined && count > 0 && (
                    <span className={`text-[9px] ${active ? 'opacity-75' : 'text-ink-soft'}`}>
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card pad={16}>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                <TrendingUp size={16} strokeWidth={1.5} />
              </div>
              <p className="font-serif text-[24px] leading-none text-ink">{brl(totalRevenue)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Faturado</p>
            </Card>
            <Card pad={16}>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-warning-soft text-warning">
                <Clock size={16} strokeWidth={1.5} />
              </div>
              <p className="font-serif text-[24px] leading-none text-ink">{brl(pendingTotal)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-soft">A receber</p>
            </Card>
            <Card pad={16}>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                <ShoppingCart size={16} strokeWidth={1.5} />
              </div>
              <p className="font-serif text-[24px] leading-none text-ink">{sales.filter((s) => s.status === 'paid').length}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Concluídas</p>
            </Card>
            <Card pad={16}>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-warning-soft text-warning">
                <CircleDollarSign size={16} strokeWidth={1.5} />
              </div>
              <p className="font-serif text-[24px] leading-none text-ink">{pending.length}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Pendentes</p>
            </Card>
          </div>

          {/* CTA */}
          <Card className="bg-primary text-paper" pad={22}>
            <ShoppingCart size={26} strokeWidth={1.4} />
            <h2 className="m-0 mt-3 font-serif text-[26px] font-normal">Nova venda em 5 passos</h2>
            <p className="mt-2 text-[12px] text-paper/75">Cliente → peças → quantidade → pagamento → conclusão.</p>
            <Link href="/vendas/novo">
              <Button className="mt-4" variant="secondary" size="sm">Iniciar venda</Button>
            </Link>
          </Card>

          {/* List */}
          <div>
            <SectionHead eyebrow="Histórico" title="Todas as vendas" />
            {filtered.length === 0 ? (
              <Card pad={18}>
                <p className="text-[13px] text-ink-soft">
                  {source === 'fallback' ? 'Faça login para carregar as vendas reais.' : 'Nenhuma venda encontrada.'}
                </p>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filtered.map((sale) => (
                  <Link key={sale.id} href={`/vendas/${sale.id}`} className="block">
                    <Card pad={16} className="transition-shadow hover:shadow-s2 cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h2 className="m-0 truncate font-serif text-[18px] font-normal text-ink">{sale.clientName}</h2>
                            {sale.orderSource === 'shop' && (
                              <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold tracking-wide-1 uppercase bg-primary/10 text-primary">
                                <ShoppingBag size={9} />
                                Loja
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-ink-soft">
                            {sale.orderNumber
                              ? `${sale.orderNumber} · `
                              : ''
                            }{sale.itemCount} {sale.itemCount === 1 ? 'item' : 'itens'} · {PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod} · {sale.createdAt}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Badge tone={STATUS_TONE[sale.status] ?? 'neutral'} size="sm">
                            {STATUS_LABEL[sale.status] ?? sale.status}
                          </Badge>
                          <p className="mt-2 font-serif text-[18px] text-ink">{brl(sale.total)}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </section>
      </main>
    </>
  );
}
