import Link from 'next/link';
import { AlertTriangle, BarChart3, Gem, Package, Scissors, ShoppingCart, TrendingUp } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { DataNotice } from '@/components/app/DataNotice';
import { Badge } from '@/components/ui/Badge';
import { Card, SectionHead, Divider } from '@/components/ui/Primitives';
import { getReportsSummary } from '@/lib/app-data';
import { brl } from '@/lib/utils';

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'PIX', card: 'Cartão', cash: 'Dinheiro', transfer: 'Transferência',
};

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success', pending: 'warning', cancelled: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
  paid: 'Pago', pending: 'Pendente', cancelled: 'Cancelado',
};

export default async function RelatoriosPage() {
  const { summary, source, error } = await getReportsSummary();
  const maxUnits = Math.max(1, ...summary.topPieces.map((item) => item.unitsSold));
  const maxSale = Math.max(1, ...summary.salesMonth.map((s) => s.total));

  return (
    <>
      <AppBar large eyebrow="Relatórios" title="Visão geral" />
      <Topbar eyebrow="Relatórios" title="Visão geral" />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-5xl space-y-6">
          <DataNotice source={source} error={error} />

          {/* KPIs do mês */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card pad={16}>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                <TrendingUp size={15} strokeWidth={1.5} />
              </div>
              <p className="font-serif text-[24px] leading-none text-ink">{brl(summary.revenueMonth)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Faturamento</p>
            </Card>
            <Card pad={16}>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                <BarChart3 size={15} strokeWidth={1.5} />
              </div>
              <p className="font-serif text-[24px] leading-none text-ink">{brl(summary.grossMonth)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Lucro bruto</p>
            </Card>
            <Card pad={16}>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                <ShoppingCart size={15} strokeWidth={1.5} />
              </div>
              <p className="font-serif text-[24px] leading-none text-ink">{summary.piecesSold}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Peças vendidas</p>
            </Card>
            <Card pad={16}>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-warning-soft text-warning">
                <AlertTriangle size={15} strokeWidth={1.5} />
              </div>
              <p className="font-serif text-[24px] leading-none text-ink">{summary.lowStock.length}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Estoque baixo</p>
            </Card>
          </div>

          {/* Top peças */}
          <div>
            <SectionHead eyebrow="Últimos 30 dias" title="Peças mais vendidas" />
            <Card pad={18}>
              {summary.topPieces.length === 0 ? (
                <p className="text-[13px] text-ink-soft">Nenhuma venda registrada ainda.</p>
              ) : (
                <div className="space-y-4">
                  {summary.topPieces.map((item, i) => (
                    <div key={item.id}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-[12px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-ink-soft">{String(i + 1).padStart(2, '0')}</span>
                          <span className="font-medium text-ink">{item.name}</span>
                        </div>
                        <span className="text-ink-soft">{item.unitsSold} un · {brl(item.gross)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.max(6, (item.unitsSold / maxUnits) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Vendas do mês */}
          <div>
            <SectionHead eyebrow="Mês atual" title="Vendas" />
            {summary.salesMonth.length === 0 ? (
              <Card pad={18}><p className="text-[13px] text-ink-soft">Nenhuma venda neste mês.</p></Card>
            ) : (
              <Card pad={18}>
                <div className="space-y-3">
                  {summary.salesMonth.map((sale) => (
                    <Link key={sale.id} href={`/vendas/${sale.id}`} className="block">
                      <div className="flex items-center gap-3 rounded-[10px] p-2 hover:bg-surface transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-medium text-ink">{sale.clientName}</span>
                            <Badge tone={STATUS_TONE[sale.status] ?? 'neutral'} size="sm">{STATUS_LABEL[sale.status] ?? sale.status}</Badge>
                          </div>
                          <p className="mt-0.5 text-[11px] text-ink-soft">
                            {sale.piecesQty} peças · {PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod} · {sale.createdAt}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-serif text-[16px] text-ink">{brl(sale.total)}</p>
                          {sale.grossProfit > 0 && (
                            <p className="text-[10px] text-ink-soft">+{brl(sale.grossProfit)} lucro</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink/[0.06]">
                        <div className="h-full rounded-full bg-primary/50" style={{ width: `${Math.max(4, (sale.total / maxSale) * 100)}%` }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Produção */}
          <div>
            <SectionHead eyebrow="Operacional" title="Ordens de produção" action={<Link href="/producao"><span className="text-[11px] text-primary">Ver tudo</span></Link>} />
            {summary.productionReport.length === 0 ? (
              <Card pad={18}><p className="text-[13px] text-ink-soft">Nenhuma OP registrada.</p></Card>
            ) : (
              <Card pad={18}>
                <div className="space-y-3">
                  {summary.productionReport.slice(0, 8).map((op) => (
                    <Link key={op.id} href={`/producao/${op.id}`} className="block">
                      <div className="flex items-center gap-3 rounded-[10px] p-2 hover:bg-surface transition-colors">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                          <Scissors size={16} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-ink-soft">#{op.opNumber}</span>
                            <span className="truncate text-[13px] font-medium text-ink">{op.pieceName}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-ink-soft">{op.clientName} · {op.qty} un.</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge
                            tone={op.overdue ? 'danger' : op.status === 'Finalizada' || op.status === 'Entregue' ? 'success' : 'neutral'}
                            size="sm"
                          >
                            {op.overdue ? 'Atrasada' : op.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Bordagem */}
          <div>
            <SectionHead eyebrow="Operacional" title="Remessas de bordagem" action={<Link href="/bordagem"><span className="text-[11px] text-primary">Ver tudo</span></Link>} />
            {summary.embroideryReport.length === 0 ? (
              <Card pad={18}><p className="text-[13px] text-ink-soft">Nenhuma remessa registrada.</p></Card>
            ) : (
              <Card pad={18}>
                <div className="space-y-3">
                  {summary.embroideryReport.slice(0, 6).map((em) => (
                    <div key={em.id} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-soft text-secondary">
                        <Gem size={16} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-ink-soft">{em.code}</span>
                          <span className="truncate text-[13px] font-medium text-ink">{em.seamstressName}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink-soft">{em.qty} peças · {brl(em.value)}</p>
                      </div>
                      <Badge tone={em.overdue ? 'danger' : em.status === 'Finalizada' ? 'success' : 'secondary'} size="sm">
                        {em.overdue ? 'Atrasada' : em.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Estoque baixo */}
          {summary.lowStock.length > 0 && (
            <div>
              <SectionHead eyebrow="Atenção" title="Estoque crítico" action={<Link href="/estoque"><span className="text-[11px] text-primary">Ver estoque</span></Link>} />
              <Card pad={18}>
                <div className="space-y-3">
                  {summary.lowStock.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
                        <Package size={16} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{item.name}</p>
                        <p className="mt-0.5 text-[11px] text-ink-soft">
                          {item.collectionName ?? 'Sem coleção'} · Tam. {item.size}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-serif text-[18px] text-ink">{item.quantity}</p>
                        <p className="text-[10px] text-ink-soft">mín. {item.lowThreshold}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

        </section>
      </main>
    </>
  );
}
