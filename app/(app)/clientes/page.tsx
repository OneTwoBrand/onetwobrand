import { Plus, Search, User } from 'lucide-react';
import Link from 'next/link';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { DataNotice } from '@/components/app/DataNotice';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar, Card, SectionHead } from '@/components/ui/Primitives';
import { getClients } from '@/lib/app-data';
import { brl } from '@/lib/utils';

export default async function ClientesPage() {
  const { clients, source, error } = await getClients();
  const vipClients = clients.filter((client) => client.vip);

  return (
    <>
      <AppBar large eyebrow="Clientes" title={`${clients.length} cadastros`} action={<Link href="/clientes/novo"><Button size="sm" icon={<Plus size={14} />}>Nova</Button></Link>} />
      <Topbar eyebrow="Clientes" title={`${clients.length} cadastros`} action={<Link href="/clientes/novo"><Button size="sm" icon={<Plus size={14} />}>Nova cliente</Button></Link>} />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-5xl">
          <DataNotice source={source} error={error} />
          <div className="mb-4 flex h-12 items-center gap-3 rounded-[14px] border border-line bg-paper px-4 text-ink-soft">
            <Search size={16} strokeWidth={1.5} />
            <span className="text-[13px]">Buscar nome, cidade ou telefone</span>
          </div>
          <SectionHead eyebrow="Em destaque" title="Clientes VIP" />
          <div className="mb-5 flex gap-3 overflow-x-auto pb-1">
            {vipClients.map((client) => (
              <Link key={client.id} href={`/clientes/${client.id}`} className="block shrink-0">
                <Card pad={14} className="min-w-[150px] cursor-pointer hover:shadow-s2 transition-shadow">
                  <Avatar name={client.name} tone="primary" />
                  <h2 className="m-0 mt-3 font-serif text-[17px] font-normal text-ink">{client.name}</h2>
                  <p className="mt-1 text-[11px] text-ink-soft">{client.totalPieces} peças</p>
                </Card>
              </Link>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {clients.map((client) => (
              <Link key={client.id} href={`/clientes/${client.id}`} className="block">
                <Card pad={16} className="cursor-pointer hover:shadow-s2 transition-shadow">
                  <div className="flex items-center gap-3">
                    <Avatar name={client.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="m-0 truncate font-serif text-[18px] font-normal text-ink">{client.name}</h2>
                        {client.vip && <Badge tone="primary" size="sm">VIP</Badge>}
                      </div>
                      <p className="mt-1 text-[11px] text-ink-soft">{client.city ?? '-'}, {client.state ?? '--'} · {client.totalPieces} peças</p>
                    </div>
                    <div className="text-right">
                      <User size={15} className="ml-auto text-ink-soft" />
                      <p className="mt-1 text-[11px] text-ink-soft">{brl(client.totalSpent)}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
