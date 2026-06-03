import Link from 'next/link';
import { ArrowLeft, Package, ShoppingCart, User } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar, Card, Divider, SectionHead } from '@/components/ui/Primitives';
import { getSaleDetail } from '@/lib/sales-data';
import { brl } from '@/lib/utils';
import { SaleActions } from './SaleActions';

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'PIX',
  card: 'Cartão',
  cash: 'Dinheiro',
  transfer: 'Transferência',
  installment: 'Parcelado',
};

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success',
  pending: 'warning',
  cancelled: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  cancelled: 'Cancelado',
};

export default async function VendaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sale, source } = await getSaleDetail(id);

  if (!sale && source === 'supabase') notFound();

  if (!sale) {
    return (
      <>
        <AppBar title="Venda" back />
        <Topbar eyebrow="Vendas" title="Detalhe" action={<Link href="/vendas"><Button size="sm" variant="ghost">Voltar</Button></Link>} />
        <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
          <div className="mx-auto max-w-xl">
            <Card pad={20}>
              <p className="text-[13px] text-ink-soft">Venda não encontrada ou não autorizada.</p>
            </Card>
          </div>
        </main>
      </>
    );
  }

  const totalItems = sale.items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <>
      <AppBar title={`Venda · ${sale.clientName}`} back />
      <Topbar
        eyebrow="Vendas"
        title={`Venda · ${sale.clientName}`}
        action={<Link href="/vendas"><Button size="sm" variant="ghost" icon={<ArrowLeft size={14} />}>Voltar</Button></Link>}
      />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">

            {/* Hero */}
            <Card pad={22}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <ShoppingCart size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <Badge tone={STATUS_TONE[sale.status] ?? 'neutral'} size="sm">
                    {STATUS_LABEL[sale.status] ?? sale.status}
                  </Badge>
                  <p className="mt-1 text-[11px] text-ink-soft">{sale.createdAt}</p>
                </div>
              </div>
              <div className="mt-4 font-serif text-[40px] font-light leading-none text-ink">
                {brl(sale.total)}
              </div>
              <p className="mt-2 text-[13px] text-ink-soft">
                {totalItems} {totalItems === 1 ? 'peça' : 'peças'} · {PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod}
              </p>
            </Card>

            {/* Items */}
            <Card pad={20}>
              <SectionHead eyebrow="Itens" title="Peças vendidas" />
              <div className="space-y-3">
                {sale.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-surface text-primary">
                      <Package size={18} strokeWidth={1.4} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{item.pieceName}</p>
                      <p className="text-[11px] text-ink-soft">
                        {item.size}{item.color ? ` · ${item.color}` : ''} · {item.qty} un.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-[16px] text-ink">{brl(item.unitPrice * item.qty)}</p>
                      <p className="text-[10px] text-ink-soft">{brl(item.unitPrice)} un.</p>
                    </div>
                  </div>
                ))}
                {sale.items.length === 0 && (
                  <p className="text-[12px] text-ink-soft">Nenhum item registrado.</p>
                )}
              </div>
              <Divider className="my-4" />
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-ink-soft">Total</span>
                <span className="font-serif text-[22px] text-ink">{brl(sale.total)}</span>
              </div>
            </Card>

          </div>

          <aside className="space-y-5">
            {/* Client */}
            <Card pad={20}>
              <SectionHead eyebrow="Comprador" title="Cliente" />
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={sale.clientName} tone="primary" />
                <div>
                  <p className="font-serif text-[17px] text-ink">{sale.clientName}</p>
                  <p className="text-[11px] text-ink-soft">
                    <User size={11} className="mr-1 inline" />
                    Ver perfil
                  </p>
                </div>
              </div>
            </Card>

            {/* Payment */}
            <Card pad={20}>
              <SectionHead eyebrow="Pagamento" title="Forma" />
              <dl className="mt-3 space-y-3 text-[12px]">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Método</dt>
                  <dd className="text-ink">{PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Status</dt>
                  <dd>
                    <Badge tone={STATUS_TONE[sale.status] ?? 'neutral'} size="sm">
                      {STATUS_LABEL[sale.status] ?? sale.status}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Data</dt>
                  <dd className="text-ink">{sale.createdAt}</dd>
                </div>
              </dl>
            </Card>

            {/* Actions */}
            <SaleActions saleId={sale.id} status={sale.status} />
          </aside>
        </section>
      </main>
    </>
  );
}
