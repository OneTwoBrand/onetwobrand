import { Calendar, Scissors } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, Divider } from '@/components/ui/Primitives';

export default function ProducaoDetalhePage({ params }: { params: { id: string } }) {
  return (
    <>
      <AppBar title={`OP · ${params.id}`} back />
      <Topbar eyebrow="Produção" title={`OP #${params.id}`} action={<Button size="sm">Atualizar status</Button>} />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Card pad={20}>
            <div className="mb-4 flex h-44 items-center justify-center rounded-[16px] border border-line bg-surface text-primary">
              <Scissors size={42} strokeWidth={1.2} />
            </div>
            <div className="flex items-center justify-between">
              <Badge tone="primary">Em produção</Badge>
              <span className="font-mono text-[11px] text-ink-soft">#{params.id}</span>
            </div>
            <h1 className="mt-4 font-serif text-[32px] font-normal leading-[1.05] text-ink">Vestido Lis</h1>
            <p className="mt-2 text-[13px] text-ink-soft">Linho cru · Clara Bianchi · 6 peças</p>
          </Card>
          <Card pad={20}>
            <h2 className="m-0 font-serif text-[24px] font-normal text-ink">Andamento</h2>
            <Divider className="my-4" />
            {['Corte', 'Costura', 'Bordagem', 'Revisão', 'Entrega'].map((step, index) => (
              <div key={step} className="mb-4 flex items-center justify-between text-[13px]">
                <span className={index <= 2 ? 'text-ink' : 'text-ink-soft'}>{step}</span>
                <span className="flex items-center gap-1.5 text-ink-soft"><Calendar size={13} />{index <= 1 ? 'Concluído' : 'Pendente'}</span>
              </div>
            ))}
          </Card>
        </section>
      </main>
    </>
  );
}
