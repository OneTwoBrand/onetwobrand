import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { OPRow } from '@/components/app/Composites';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getProductionOrders } from '@/lib/production/orders';
import { getWorkflowConfig } from '@/lib/workflow-config';
import { KanbanBoard } from './KanbanBoard';

export default async function ProducaoPage() {
  const [{ orders, source, error }, wfConfig] = await Promise.all([
    getProductionOrders(),
    getWorkflowConfig(),
  ]);

  const doneStatuses = wfConfig.op_statuses.slice(-2); // last 2 statuses = "done"
  const active = orders.filter((o) => !doneStatuses.includes(o.status));
  const done = orders.filter((o) => doneStatuses.includes(o.status));
  const overdue = active.filter((o) => o.dueDate && new Date(o.dueDate) < new Date());

  const title = `${active.length} ativas${overdue.length > 0 ? ` · ${overdue.length} atrasadas` : ''}`;

  const newButton = (
    <Link href="/producao/novo">
      <Button size="sm" icon={<Plus size={14} />}>Nova ordem de produção</Button>
    </Link>
  );

  return (
    <>
      <AppBar large eyebrow="Produção" title={title} action={<Link href="/producao/novo"><Button size="sm" icon={<Plus size={14} />}>Nova ordem</Button></Link>} />
      <Topbar eyebrow="Produção" title={title} action={newButton} />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <div className="mx-auto max-w-full">

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

          {/* Kanban — desktop */}
          <div className="hidden md:block">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                Arraste os cartões entre colunas para atualizar o status
              </p>
            </div>
            <KanbanBoard
              initialOrders={orders.filter((o) => o.id)}
              columns={wfConfig.op_statuses}
              doneStatuses={doneStatuses}
            />

            {/* Finalizadas — lista abaixo do kanban */}
            {done.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-soft">Finalizadas / Entregues</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {done.map((order) => (
                    <OPRow key={order.opNumber} {...order} href={`/producao/${order.id ?? order.opNumber}`} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lista — mobile */}
          <div className="md:hidden">
            <div className="mb-4 flex h-12 items-center gap-3 rounded-[14px] border border-line bg-paper px-4 text-ink-soft">
              <Search size={16} strokeWidth={1.5} />
              <span className="text-[13px]">Buscar OP, cliente ou peça</span>
            </div>
            <div className="grid gap-3">
              {orders.map((order) => (
                <OPRow key={order.opNumber} {...order} href={`/producao/${order.id ?? order.opNumber}`} />
              ))}
              {orders.length === 0 && (
                <p className="py-8 text-center text-[13px] text-ink-soft">Nenhuma OP registrada ainda.</p>
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
