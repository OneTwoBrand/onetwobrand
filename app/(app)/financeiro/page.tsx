import { Calendar, CircleDollarSign } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { DataNotice } from '@/components/app/DataNotice';
import { Card, SectionHead } from '@/components/ui/Primitives';
import { getFinancialSummary } from '@/lib/app-data';
import { brl, daysUntil } from '@/lib/utils';

export default async function FinanceiroPage() {
  const { summary, source, error } = await getFinancialSummary();

  return (
    <>
      <AppBar large eyebrow="Financeiro" title="Junho 2026" />
      <Topbar eyebrow="Financeiro" title="Junho 2026" />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-5xl">
          <DataNotice source={source} error={error} />
          <Card className="mb-5 bg-ink text-paper" pad={22}>
            <p className="m-0 text-[10px] uppercase tracking-[0.24em] text-paper/70">Faturamento</p>
            <div className="mt-2 font-serif text-[44px] font-light leading-none">{brl(summary.revenueMonth)}</div>
            <p className="mt-3 text-[12px] text-paper/70">Baseado em vendas pagas no mês atual</p>
          </Card>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <Card pad={16}><MoneyKpi label="A receber" value={summary.toReceive} /></Card>
            <Card pad={16}><MoneyKpi label="A pagar" value={summary.toPay} /></Card>
          </div>
          <SectionHead eyebrow="Próximos" title="Vencimentos" />
          <div className="grid gap-3 md:grid-cols-2">
            {summary.payables.map((item) => {
              const due = daysUntil(item.dueDate);
              return (
                <Card key={item.id} pad={16}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="m-0 font-serif text-[18px] font-normal text-ink">{item.supplier}</h2>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ink-soft">{item.category ?? 'despesa'}</p>
                    </div>
                    <div className="text-right">
                      <p className="m-0 text-[13px] font-medium text-ink">{brl(item.amount)}</p>
                      <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-ink-soft"><Calendar size={12} />{due.label}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}

function MoneyKpi({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-soft text-primary"><CircleDollarSign size={17} /></div>
      <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-ink-soft">{label}</p>
      <p className="m-0 mt-2 font-serif text-[30px] leading-none text-ink">{brl(value)}</p>
    </div>
  );
}
