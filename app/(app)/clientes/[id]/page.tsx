import Link from 'next/link';
import { ArrowLeft, Calendar, Mail, MapPin, Package, Phone, Scissors, ShoppingBag, ShoppingCart } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Avatar, Card, Divider, SectionHead } from '@/components/ui/Primitives';
import { getClientDetail, getClientShopOrders } from '@/lib/app-data';
import { brl } from '@/lib/utils';

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'PIX', card: 'Cartão', cash: 'Dinheiro', transfer: 'Transferência',
};
const SALE_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  paid: 'success', pending: 'warning', cancelled: 'danger',
};
const SALE_LABEL: Record<string, string> = {
  paid: 'Pago', pending: 'Pendente', cancelled: 'Cancelado',
};

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ client, source }, shopOrders] = await Promise.all([
    getClientDetail(id),
    getClientShopOrders(id),
  ]);

  if (!client && source === 'supabase') notFound();

  if (!client) {
    return (
      <>
        <AppBar title="Cliente" back />
        <Topbar eyebrow="Clientes" title="Detalhe" action={<Link href="/clientes"><Button size="sm" variant="ghost">Voltar</Button></Link>} />
        <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
          <div className="mx-auto max-w-xl">
            <Card pad={20}><p className="text-[13px] text-ink-soft">Cliente não encontrado ou não autorizado.</p></Card>
          </div>
        </main>
      </>
    );
  }

  const totalRevenue = client.sales.filter((s) => s.status === 'paid').reduce((sum, s) => sum + s.total, 0);

  return (
    <>
      <AppBar title={client.name} back />
      <Topbar
        eyebrow="Clientes"
        title={client.name}
        action={<Link href="/clientes"><Button size="sm" variant="ghost" icon={<ArrowLeft size={14} />}>Voltar</Button></Link>}
      />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">

            {/* Histórico de vendas */}
            <Card pad={20}>
              <SectionHead eyebrow="Histórico" title="Compras" />
              {client.sales.length === 0 ? (
                <p className="mt-3 text-[12px] text-ink-soft">Nenhuma compra registrada.</p>
              ) : (
                <div className="mt-2 space-y-3">
                  {client.sales.map((sale) => (
                    <Link key={sale.id} href={`/vendas/${sale.id}`} className="block">
                      <div className="flex items-center gap-3 rounded-[10px] p-2 hover:bg-surface transition-colors">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                          <ShoppingCart size={16} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-ink">{brl(sale.total)}</span>
                            <Badge tone={SALE_TONE[sale.status] ?? 'neutral'} size="sm">
                              {SALE_LABEL[sale.status] ?? sale.status}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-[11px] text-ink-soft">
                            {PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod} · {sale.createdAt}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            {/* Pedidos online */}
            {shopOrders.length > 0 && (
              <Card pad={20}>
                <SectionHead
                  eyebrow="Loja online"
                  title="Pedidos"
                  action={
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold tracking-wide-1 uppercase bg-primary/10 text-primary">
                      <ShoppingBag size={9} />
                      {shopOrders.length}
                    </span>
                  }
                />
                <div className="mt-2 space-y-2">
                  {shopOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-3 rounded-[10px] p-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Package size={15} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-ink-soft">{order.orderNumber}</span>
                          <span className="text-[13px] font-medium text-ink">{brl(order.total)}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink-soft">
                          {order.itemCount} {order.itemCount === 1 ? 'peça' : 'peças'} · {order.createdAt}
                        </p>
                      </div>
                      <Badge
                        tone={
                          order.paymentStatus === 'paid'    ? 'success' :
                          order.paymentStatus === 'pending' ? 'warning' : 'danger'
                        }
                        size="sm"
                      >
                        {order.paymentStatus === 'paid' ? 'Pago' : order.paymentStatus === 'pending' ? 'Pendente' : 'Falhou'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* OPs vinculadas */}
            <Card pad={20}>
              <SectionHead eyebrow="Produção" title="Ordens vinculadas" />
              {client.orders.length === 0 ? (
                <p className="mt-3 text-[12px] text-ink-soft">Nenhuma ordem de produção registrada.</p>
              ) : (
                <div className="mt-2 space-y-3">
                  {client.orders.map((order) => (
                    <Link key={order.id} href={`/producao/${order.id}`} className="block">
                      <div className="flex items-center gap-3 rounded-[10px] p-2 hover:bg-surface transition-colors">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-soft text-secondary">
                          <Scissors size={16} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-ink-soft">#{order.opNumber}</span>
                            <span className="truncate text-[13px] font-medium text-ink">{order.productName}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-ink-soft">
                            {order.qty} un. · {order.dueDate}
                          </p>
                        </div>
                        <StatusBadge status={order.status as never} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

          </div>

          <aside className="space-y-5">
            {/* Hero */}
            <Card pad={20}>
              <div className="flex flex-col items-center text-center">
                <Avatar name={client.name} size={56} tone="primary" />
                <h1 className="m-0 mt-4 font-serif text-[26px] font-normal text-ink">{client.name}</h1>
                {client.vip && <Badge tone="primary" size="sm" className="mt-2">VIP</Badge>}
              </div>
              <Divider className="my-4" />
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="font-serif text-[24px] text-ink">{client.totalPieces}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft">Peças</p>
                </div>
                <div>
                  <p className="font-serif text-[20px] text-ink">{brl(totalRevenue)}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft">Gasto</p>
                </div>
              </div>
            </Card>

            {/* Contato */}
            <Card pad={20}>
              <SectionHead eyebrow="Dados" title="Contato" />
              <dl className="mt-3 space-y-3 text-[12px]">
                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={14} className="shrink-0 text-ink-soft" />
                    <a href={`tel:${client.phone}`} className="text-ink hover:text-primary transition-colors">{client.phone}</a>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={14} className="shrink-0 text-ink-soft" />
                    <a href={`mailto:${client.email}`} className="truncate text-ink hover:text-primary transition-colors">{client.email}</a>
                  </div>
                )}
                {(client.city || client.state) && (
                  <div className="flex items-center gap-3">
                    <MapPin size={14} className="shrink-0 text-ink-soft" />
                    <span className="text-ink">{[client.city, client.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {client.createdAt && (
                  <div className="flex items-center gap-3">
                    <Calendar size={14} className="shrink-0 text-ink-soft" />
                    <span className="text-ink-soft">Cliente desde {client.createdAt}</span>
                  </div>
                )}
                {!client.phone && !client.email && !client.city && (
                  <p className="text-ink-soft">Nenhum dado de contato cadastrado.</p>
                )}
              </dl>
            </Card>

            {/* Observações */}
            {client.notes && (
              <Card pad={20}>
                <SectionHead eyebrow="Anotações" title="Observações" />
                <p className="mt-3 whitespace-pre-line text-[12px] leading-relaxed text-ink-soft">{client.notes}</p>
              </Card>
            )}

          </aside>
        </section>
      </main>
    </>
  );
}
