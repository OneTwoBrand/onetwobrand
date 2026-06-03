import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { DataNotice } from '@/components/app/DataNotice';
import { Button } from '@/components/ui/Button';
import { getSaleFormOptions } from '@/lib/sales-data';
import { SaleForm } from './SaleForm';

export default async function NovaVendaPage() {
  const { clients, stock, source, error } = await getSaleFormOptions();

  return (
    <>
      <AppBar title="Nova venda" back />
      <Topbar eyebrow="Vendas" title="Nova venda" action={<Link href="/vendas"><Button size="sm" variant="ghost" icon={<ArrowLeft size={14} />}>Voltar</Button></Link>} />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-4xl">
          <DataNotice source={source} error={error} />
          <SaleForm clients={clients} stock={stock} />
        </section>
      </main>
    </>
  );
}
