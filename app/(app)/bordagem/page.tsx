import type { ReactNode } from 'react';
import { Calendar, Gem, PackageCheck, Plus, UserRound } from 'lucide-react';
import Link from 'next/link';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { DataNotice } from '@/components/app/DataNotice';
import { Badge } from '@/components/ui/Badge';
import { Card, SectionHead } from '@/components/ui/Primitives';
import { getEmbroideryShipments } from '@/lib/app-data';
import { daysUntil } from '@/lib/utils';

export default async function BordagemPage() {
  const { shipments, source, error } = await getEmbroideryShipments();
  const active = shipments.filter((item) => item.status === 'Em Bordagem');
  const totalQty = active.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      <AppBar large eyebrow="Bordagem" title={`${totalQty} peças em trânsito`} action={<Link href="/bordagem/novo"><Button size="sm" icon={<Plus size={14} />}>Nova</Button></Link>} />
      <Topbar eyebrow="Bordagem" title={`${totalQty} peças em trânsito`} action={<Link href="/bordagem/novo"><Button size="sm" icon={<Plus size={14} />}>Nova remessa</Button></Link>} />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-5xl">
          <DataNotice source={source} error={error} />
          <div className="mb-5 grid grid-cols-3 gap-3">
            <Card pad={14}><Metric icon={<UserRound size={16} />} label="Cost." value={new Set(active.map((item) => item.seamstressName)).size} /></Card>
            <Card pad={14}><Metric icon={<Gem size={16} />} label="Peças" value={totalQty} /></Card>
            <Card pad={14}><Metric icon={<PackageCheck size={16} />} label="Remessas" value={active.length} /></Card>
          </div>
          <SectionHead eyebrow="Remessas ativas" title="Bordagens" />
          <div className="grid gap-3 md:grid-cols-2">
            {shipments.map((shipment) => {
              const due = daysUntil(shipment.expectedReturnAt);
              return (
                <Card key={shipment.id} pad={16}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-ink-soft">{shipment.code}</span>
                    <Badge tone={shipment.status === 'Finalizada' ? 'success' : 'secondary'} size="sm">{shipment.status}</Badge>
                  </div>
                  <h2 className="m-0 mt-3 font-serif text-[20px] font-normal text-ink">{shipment.seamstressName}</h2>
                  <p className="mt-1 text-[12px] text-ink-soft">{shipment.qty} peças · enviadas em {shipment.sentAt}</p>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-ink-soft">
                    <span className="flex items-center gap-1.5"><Calendar size={13} />Retorno</span>
                    <span>{due.label}</span>
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

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary-soft text-primary">{icon}</div>
      <div className="font-serif text-[28px] leading-none text-ink">{value}</div>
      <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-ink-soft">{label}</div>
    </div>
  );
}
