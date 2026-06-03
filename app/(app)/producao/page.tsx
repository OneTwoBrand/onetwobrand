import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { OPRow } from '@/components/app/Composites';
import { Button } from '@/components/ui/Button';

const orders = [
  { opNumber: '0241', productName: 'Vestido Lis — Linho cru', clientName: 'Clara Bianchi', qty: 6, seamstressName: 'Maria Helena', dueDate: '2026-06-07', status: 'Em Produção' as const },
  { opNumber: '0242', productName: 'Blusa Íris — Crepe terracota', clientName: 'Beatriz Lacerda', qty: 3, seamstressName: 'Joana Lima', dueDate: '2026-06-05', status: 'Em Bordagem' as const },
  { opNumber: '0243', productName: 'Saia Margarida — Algodão', clientName: 'Ana Toledo', qty: 2, seamstressName: 'Carla Nunes', dueDate: '2026-06-10', status: 'Aberta' as const },
];

export default function ProducaoPage() {
  return (
    <>
      <AppBar
        large
        eyebrow="Produção"
        title="14 ordens ativas"
        action={<Link href="/producao/novo"><Button size="sm" icon={<Plus size={14} />}>Nova</Button></Link>}
      />
      <Topbar
        eyebrow="Produção"
        title="14 ordens ativas"
        action={<Link href="/producao/novo"><Button size="sm" icon={<Plus size={14} />}>Nova OP</Button></Link>}
      />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex h-12 items-center gap-3 rounded-[14px] border border-line bg-paper px-4 text-ink-soft">
            <Search size={16} strokeWidth={1.5} />
            <span className="text-[13px]">Buscar OP, cliente ou peça</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {orders.map((order) => <OPRow key={order.opNumber} {...order} href={`/producao/${order.opNumber}`} />)}
          </div>
        </div>
      </main>
    </>
  );
}
