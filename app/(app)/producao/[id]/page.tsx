import { Calendar, Clock, FileText, Scissors, UserRound } from 'lucide-react';
import Link from 'next/link';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Card, Divider, SectionHead } from '@/components/ui/Primitives';
import { getProductionOrderDetail, getOPHistory } from '@/lib/production/orders';
import { daysUntil } from '@/lib/utils';
import { StatusActions } from './StatusActions';

const productionSteps = ['Corte', 'Costura', 'Bordagem', 'Revisão', 'Entrega'];

function stepState(index: number, status: string) {
  const currentByStatus: Record<string, number> = {
    'Aberta': 0,
    'Aguardando Material': 0,
    'Em Produção': 1,
    'Em Bordagem': 2,
    'Em Revisão': 3,
    'Finalizada': 4,
    'Vendida': 4,
    'Entregue': 4,
  };
  const current = currentByStatus[status] ?? 0;
  if (index < current) return 'done';
  if (index === current) return 'current';
  return 'pending';
}

function formatHistoryDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Cuiaba',
  }).format(new Date(iso));
}

export default async function ProducaoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order, source, error } = await getProductionOrderDetail(id);
  const history = order.id ? await getOPHistory(order.id) : [];
  const due = daysUntil(order.dueDate);

  return (
    <>
      <AppBar title={`OP · ${order.opNumber}`} back />
      <Topbar
        eyebrow="Produção"
        title={`OP #${order.opNumber}`}
        action={<Link href="/producao"><Button size="sm" variant="ghost">Voltar</Button></Link>}
      />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            {/* Hero */}
            <Card pad={20}>
              <div className="mb-4 flex h-44 items-center justify-center rounded-[16px] border border-line bg-surface text-primary">
                <Scissors size={42} strokeWidth={1.2} />
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <StatusBadge status={order.status} />
                <span className="font-mono text-[11px] text-ink-soft">#{order.opNumber}</span>
              </div>
              <h1 className="m-0 mt-4 font-serif text-[32px] font-normal leading-[1.05] text-ink">
                {order.productName}
              </h1>
              <p className="mt-2 text-[13px] text-ink-soft">
                {order.clientName} · {order.qty} {order.qty > 1 ? 'peças' : 'peça'}
              </p>

              {/* Status change — only when we have a real op ID */}
              {order.id && source === 'supabase' && (
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <span className="text-[11px] text-ink-soft">Alterar andamento</span>
                  <StatusActions opId={order.id} currentStatus={order.status} />
                </div>
              )}
            </Card>

            {/* Stepper */}
            <Card pad={20}>
              <SectionHead eyebrow="Etapas" title="Andamento" />
              <div className="space-y-4">
                {productionSteps.map((step, index) => {
                  const state = stepState(index, order.status);
                  return (
                    <div key={step} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-3">
                        <span className={
                          state === 'done' ? 'h-3 w-3 rounded-full bg-success' :
                          state === 'current' ? 'h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20' :
                          'h-3 w-3 rounded-full border border-line'
                        } />
                        <span className={state === 'pending' ? 'text-ink-soft' : 'text-ink'}>{step}</span>
                      </div>
                      <span className="text-[11px] text-ink-soft">
                        {state === 'done' ? 'Concluído' : state === 'current' ? 'Em andamento' : 'Pendente'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Timeline */}
            <Card pad={20}>
              <SectionHead eyebrow="Histórico" title="Linha do tempo" action={<Clock size={16} className="text-ink-soft" />} />
              <Divider className="mb-4" />
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <span className="text-[9px] font-bold">OP</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12px] font-medium text-ink">{entry.type}</span>
                          <span className="text-[10px] text-ink-soft">{formatHistoryDate(entry.createdAt)}</span>
                        </div>
                        {entry.note && (
                          <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-ink-soft">
                  {source === 'fallback'
                    ? 'Histórico disponível após autenticação com dados reais.'
                    : 'Nenhum evento registrado para esta OP ainda.'}
                </p>
              )}
            </Card>
          </div>

          <aside className="space-y-5">
            {source === 'fallback' && (
              <Card pad={16}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="m-0 text-[12px] font-medium text-ink">Dados demonstrativos</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                      {error ? `Supabase: ${error}` : 'Faça login para carregar a OP real.'}
                    </p>
                  </div>
                  <Badge tone="warning" size="sm">Fallback</Badge>
                </div>
              </Card>
            )}

            <Card pad={20}>
              <SectionHead eyebrow="Detalhes" title="Operação" />
              <dl className="grid gap-3 text-[12px]">
                <div className="flex justify-between gap-4">
                  <dt className="flex items-center gap-2 text-ink-soft"><UserRound size={14} />Cliente</dt>
                  <dd className="text-right text-ink">{order.clientName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">Costureira</dt>
                  <dd className="text-right text-ink">{order.seamstressName ?? 'Não atribuída'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="flex items-center gap-2 text-ink-soft"><Calendar size={14} />Prazo</dt>
                  <dd className={`text-right font-medium ${due.tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{due.label}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">Tecido/modelo</dt>
                  <dd className="text-right text-ink">{order.fabricUsed ?? '-'}</dd>
                </div>
                {order.createdAt && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-soft">Criada em</dt>
                    <dd className="text-right text-ink">
                      {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(order.createdAt))}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            <Card pad={20}>
              <SectionHead eyebrow="Anotações" title="Observações" action={<FileText size={16} className="text-ink-soft" />} />
              <Divider className="mb-4" />
              <p className="whitespace-pre-line text-[12px] leading-relaxed text-ink-soft">
                {order.embroideryNotes || 'Nenhuma observação registrada para esta OP.'}
              </p>
            </Card>
          </aside>
        </section>
      </main>
    </>
  );
}
