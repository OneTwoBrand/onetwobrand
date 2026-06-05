import { Bell, Box, CircleDollarSign, Package, Scissors, Search, ShoppingCart, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { KPI, OPRow } from '@/components/app/Composites';
import { DataNotice } from '@/components/app/DataNotice';
import { Button } from '@/components/ui/Button';
import { Card, SectionHead, Divider } from '@/components/ui/Primitives';
import { getDashboardSummary } from '@/lib/app-data';
import { getCurrentUserDisplay } from '@/lib/current-user';
import { brl } from '@/lib/utils';

export default async function DashboardPage() {
  const [user, dashboard] = await Promise.all([
    getCurrentUserDisplay(),
    getDashboardSummary(),
  ]);
  const { summary } = dashboard;
  const dashboardKpis = [
    { label: 'Em produção', value: summary.inProduction, delta: `${summary.overdueOps} atrasos`, icon: <Scissors size={16} strokeWidth={1.5} />, tone: 'primary' as const },
    { label: 'Bordagem', value: summary.inEmbroidery, delta: 'em trânsito', icon: <Sparkles size={16} strokeWidth={1.5} />, tone: 'secondary' as const },
    { label: 'Estoque', value: summary.stockTotal, delta: `${summary.lowStockSkus} baixos`, icon: <Package size={16} strokeWidth={1.5} />, tone: 'neutral' as const },
    { label: 'Pedidos', value: String(summary.pendingOrders).padStart(2, '0'), delta: 'pendentes', icon: <ShoppingCart size={16} strokeWidth={1.5} />, tone: 'warning' as const },
  ];

  return (
    <>
      <AppBar
        large
        eyebrow="Hoje no atelier"
        title={user.greeting}
        action={
          <div className="flex gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-ink" aria-label="Buscar">
              <Search size={17} strokeWidth={1.5} />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-ink" aria-label="Alertas">
              <Bell size={17} strokeWidth={1.5} />
            </button>
          </div>
        }
      />
      <Topbar
        eyebrow="Hoje no atelier"
        title={user.greeting}
        action={<Link href="/producao/novo"><Button size="sm" icon={<Scissors size={14} strokeWidth={1.5} />}>Nova ordem de produção</Button></Link>}
      />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-5">
            <DataNotice source={dashboard.source} error={dashboard.error} />
            <Card className="relative overflow-hidden bg-primary text-paper" pad={22}>
              <div className="relative z-10">
                <p className="m-0 text-[10px] font-medium uppercase tracking-[0.24em] text-paper/70">
                  Vendas · Junho
                </p>
                <div className="mt-2 font-serif text-[40px] font-light leading-none md:text-[56px]">
                  {brl(summary.revenueMonth)}
                </div>
                <p className="mt-3 text-[12px] text-paper/78">
                  Lucro bruto · {brl(summary.grossProfitMonth)} · líquido estimado {brl(summary.netProfitMonth)}
                </p>
              </div>
              <Box className="absolute -right-8 -top-8 text-paper/10" size={150} strokeWidth={1} />
            </Card>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {dashboardKpis.map((item) => (
                <KPI key={item.label} {...item} />
              ))}
            </div>

            <section>
              <SectionHead eyebrow="Atalho" title="Continuar produção" action={<Link href="/producao"><Button variant="ghost" size="sm">Ver tudo</Button></Link>} />
              <div className="grid gap-3 md:grid-cols-2">
                {summary.activeOrders.map((order) => (
                  <OPRow key={order.opNumber} {...order} href={`/producao/${order.opNumber}`} />
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <Card pad={18}>
              <SectionHead eyebrow="Financeiro" title="Saldo do mês" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="m-0 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">A receber</p>
                  <p className="mt-2 font-serif text-[28px] leading-none text-ink">{brl(summary.toReceive)}</p>
                </div>
                <div>
                  <p className="m-0 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">A pagar</p>
                  <p className="mt-2 font-serif text-[28px] leading-none text-ink">{brl(summary.toPay)}</p>
                </div>
              </div>
              <Divider className="my-4" />
              <div className="flex items-center gap-2 text-[12px] text-ink-soft">
                <CircleDollarSign size={15} strokeWidth={1.5} />
                Próximos vencimentos organizados para revisão.
              </div>
            </Card>

            <Card pad={18}>
              <SectionHead eyebrow="Concierge digital" title="OneTwo Assistente" />
              <p className="text-[13px] leading-relaxed text-ink-soft">
                Pergunte sobre produção, estoque, vendas ou financeiro — por texto ou por voz.
              </p>
              <Link href="/assistant">
                <Button className="mt-4" variant="soft" size="sm" icon={<Sparkles size={14} strokeWidth={1.5} />}>
                  Abrir Assistente
                </Button>
              </Link>
            </Card>
          </aside>
        </section>
      </main>
    </>
  );
}
