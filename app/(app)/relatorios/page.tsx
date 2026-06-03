import { BarChart3, Download } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { DataNotice } from '@/components/app/DataNotice';
import { Button } from '@/components/ui/Button';
import { Card, SectionHead } from '@/components/ui/Primitives';
import { getReportsSummary } from '@/lib/app-data';
import { brl } from '@/lib/utils';

export default async function RelatoriosPage() {
  const { summary, source, error } = await getReportsSummary();
  const maxUnits = Math.max(1, ...summary.topPieces.map((item) => item.unitsSold));

  return (
    <>
      <AppBar large eyebrow="Relatórios" title="Visão geral" action={<Button size="sm" icon={<Download size={14} />}>Exportar</Button>} />
      <Topbar eyebrow="Relatórios" title="Visão geral" action={<Button size="sm" icon={<Download size={14} />}>Exportar</Button>} />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-5xl">
          <DataNotice source={source} error={error} />
          <Card className="mb-5" pad={22}>
            <div className="flex items-start justify-between">
              <div>
                <p className="m-0 text-[10px] uppercase tracking-[0.24em] text-ink-soft">Peças vendidas</p>
                <div className="mt-2 font-serif text-[48px] leading-none text-ink">{summary.piecesSold}</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                <BarChart3 size={22} />
              </div>
            </div>
          </Card>
          <SectionHead eyebrow="Ranking" title="Mais vendidos" />
          <Card pad={18}>
            <div className="space-y-4">
              {summary.topPieces.map((item) => (
                <div key={item.id}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-[12px]">
                    <span className="font-medium text-ink">{item.name}</span>
                    <span className="text-ink-soft">{item.unitsSold} · {brl(item.gross)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, (item.unitsSold / maxUnits) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </>
  );
}
