import Link from 'next/link';
import { Gem, Phone, Plus, WalletCards } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { DataNotice } from '@/components/app/DataNotice';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar, Card, SectionHead } from '@/components/ui/Primitives';
import { getSeamstresses } from '@/lib/app-data';
import { brl } from '@/lib/utils';

export default async function CostureirasPage() {
  const { seamstresses, source, error } = await getSeamstresses();
  const active = seamstresses.filter((item) => item.active);
  const pendingValue = seamstresses.reduce((sum, item) => sum + item.pendingValue, 0);

  return (
    <>
      <AppBar large eyebrow="Costureiras" title={`${active.length} ativas`} action={<Link href="/costureiras/novo"><Button size="sm" icon={<Plus size={14} />}>Nova</Button></Link>} />
      <Topbar eyebrow="Costureiras" title={`${active.length} ativas`} action={<Link href="/costureiras/novo"><Button size="sm" icon={<Plus size={14} />}>Nova costureira</Button></Link>} />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-5xl">
          <DataNotice source={source} error={error} />
          <div className="mb-5 grid grid-cols-2 gap-3">
            <Card pad={16}>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-soft text-primary"><Gem size={17} /></div>
              <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Pendências</p>
              <p className="m-0 mt-2 font-serif text-[30px] leading-none text-ink">{seamstresses.reduce((sum, item) => sum + item.pendingShipments, 0)}</p>
            </Card>
            <Card pad={16}>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-soft text-primary"><WalletCards size={17} /></div>
              <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-ink-soft">A pagar</p>
              <p className="m-0 mt-2 font-serif text-[30px] leading-none text-ink">{brl(pendingValue)}</p>
            </Card>
          </div>

          <SectionHead eyebrow="Equipe" title="Atelier externo" />
          <div className="grid gap-3 md:grid-cols-2">
            {seamstresses.map((item) => (
              <Card key={item.id} pad={16}>
                <div className="flex items-start gap-3">
                  <Avatar name={item.name} tone={item.role === 'Bordadeira' ? 'secondary' : 'primary'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="m-0 font-serif text-[19px] font-normal text-ink">{item.name}</h2>
                      <Badge tone={item.active ? 'success' : 'neutral'} size="sm">{item.active ? 'ativa' : 'inativa'}</Badge>
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ink-soft">{item.role}</p>
                    {item.specialty && <p className="mt-2 text-[12px] text-ink-soft">{item.specialty}</p>}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-ink-soft">
                      <span className="flex items-center gap-1.5"><Gem size={12} />{item.pendingShipments} remessas</span>
                      <span className="flex items-center gap-1.5"><WalletCards size={12} />{brl(item.pendingValue)}</span>
                    </div>
                    {(item.phone || item.pix) && (
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-ink-soft">
                        {item.phone && <span className="flex items-center gap-1.5"><Phone size={12} />{item.phone}</span>}
                        {item.pix && <span>PIX · {item.pix}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
