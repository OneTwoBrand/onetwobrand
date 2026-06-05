import { Calendar, Check, CircleDollarSign, TrendingUp } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { DataNotice } from '@/components/app/DataNotice';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, SectionHead } from '@/components/ui/Primitives';
import { getClients, getFinancialSummary } from '@/lib/app-data';
import { getWorkflowConfig } from '@/lib/workflow-config';
import { brl, daysUntil } from '@/lib/utils';
import { FinanceForms } from './FinanceForms';
import { markPayablePaid, markReceivableReceived } from './actions';

export default async function FinanceiroPage() {
  const [financial, clientsResult, workflowConfig] = await Promise.all([
    getFinancialSummary(),
    getClients(),
    getWorkflowConfig(),
  ]);
  const { summary, source, error } = financial;

  const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date())
    .replace(/^\w/, (c) => c.toUpperCase());

  return (
    <>
      <AppBar large eyebrow="Financeiro" title={monthTitle} />
      <Topbar eyebrow="Financeiro" title={monthTitle} />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-5xl">
          <DataNotice source={source} error={error} />
          <Card className="mb-5 bg-ink text-paper" pad={22}>
            <p className="m-0 text-[10px] uppercase tracking-[0.24em] text-paper/70">Faturamento</p>
            <div className="mt-2 font-serif text-[44px] font-light leading-none">{brl(summary.revenueMonth)}</div>
            <p className="mt-3 text-[12px] text-paper/70">
              Lucro bruto {brl(summary.grossProfitMonth)} · líquido estimado {brl(summary.netProfitMonth)}
            </p>
          </Card>
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card pad={16}><MoneyKpi label="A receber" value={summary.toReceive} /></Card>
            <Card pad={16}><MoneyKpi label="A pagar" value={summary.toPay} /></Card>
            <Card pad={16}><MoneyKpi label="Despesas pagas" value={summary.expensesPaidMonth} /></Card>
            <Card pad={16}><MoneyKpi label="Lucro líquido" value={summary.netProfitMonth} icon={<TrendingUp size={17} />} /></Card>
          </div>

          <section className="mb-5">
            <SectionHead eyebrow="Lançamentos" title="Novo movimento" />
            <FinanceForms
              clients={clientsResult.clients}
              financeSuppliers={workflowConfig.finance_suppliers}
              financeCategories={workflowConfig.finance_categories}
            />
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section>
              <SectionHead eyebrow="Saídas" title="Contas a pagar" />
              <div className="grid gap-3">
                {summary.payables.map((item) => {
                  const due = daysUntil(item.dueDate);
                  return (
                    <Card key={item.id} pad={16}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="m-0 font-serif text-[18px] font-normal text-ink">{item.supplier}</h2>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ink-soft">{item.category ?? 'despesa'}</p>
                          <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-soft"><Calendar size={12} />{due.label}</p>
                        </div>
                        <div className="text-right">
                          <Badge tone={item.status === 'paid' ? 'success' : 'warning'} size="sm">{item.status}</Badge>
                          <p className="mt-2 text-[13px] font-medium text-ink">{brl(item.amount)}</p>
                          {item.status !== 'paid' && (
                            <form action={markPayablePaid} className="mt-2">
                              <input type="hidden" name="id" value={item.id} />
                              <Button type="submit" size="sm" variant="soft" icon={<Check size={13} />}>Pagar</Button>
                            </form>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>

            <section>
              <SectionHead eyebrow="Entradas" title="Contas a receber" />
              <div className="grid gap-3">
                {summary.receivables.length ? summary.receivables.map((item) => {
                  const due = daysUntil(item.dueDate);
                  return (
                    <Card key={item.id} pad={16}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="m-0 font-serif text-[18px] font-normal text-ink">{item.clientName}</h2>
                          <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-soft"><Calendar size={12} />{due.label}</p>
                        </div>
                        <div className="text-right">
                          <Badge tone={item.status === 'paid' ? 'success' : 'warning'} size="sm">{item.status}</Badge>
                          <p className="mt-2 text-[13px] font-medium text-ink">{brl(item.amount)}</p>
                          {item.status !== 'paid' && (
                            <form action={markReceivableReceived} className="mt-2">
                              <input type="hidden" name="id" value={item.id} />
                              <Button type="submit" size="sm" variant="soft" icon={<Check size={13} />}>Receber</Button>
                            </form>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                }) : (
                  <Card pad={16}>
                    <p className="m-0 text-[13px] text-ink-soft">Nenhuma conta a receber pendente ou recente.</p>
                  </Card>
                )}
              </div>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}

function MoneyKpi({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-soft text-primary">{icon ?? <CircleDollarSign size={17} />}</div>
      <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-ink-soft">{label}</p>
      <p className="m-0 mt-2 font-serif text-[30px] leading-none text-ink">{brl(value)}</p>
    </div>
  );
}
