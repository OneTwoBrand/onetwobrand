/**
 * ONE TWO · /conta/pedidos
 * Lista protegida pela sessão HTTP assinada do cliente.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Package, ShoppingBag } from 'lucide-react';
import { cn, brl } from '@/lib/utils';
import { getCustomerOrders } from '@/lib/shop/checkout-actions';
import type { CustomerOrderItem } from '@/lib/shop/checkout-actions';

const STATUS_LABEL: Record<string, string> = {
  pending:   'Aguardando pagamento',
  paid:      'Pago',
  failed:    'Falha no pagamento',
  refunded:  'Estornado',
};

const FULFILLMENT_LABEL: Record<string, string> = {
  pending:    'Aguardando produção',
  confirmed:  'Confirmado',
  production: 'Em produção',
  finishing:  'Acabamento',
  shipped:    'Enviado',
  delivered:  'Entregue',
  cancelled:  'Cancelado',
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso));
}

export default function PedidosPage() {
  const [orders,  setOrders]  = useState<CustomerOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(true);

  useEffect(() => {
    getCustomerOrders().then(({ orders: result, error }) => {
      setOrders(result);
      if (error) setHasSession(false);
      setLoading(false);
    }).catch(() => {
      setHasSession(false);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-lg mx-auto pt-4 pb-28 lg:pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/conta" className="text-[12px] text-ink-soft hover:text-ink transition-colors">
          Minha conta
        </Link>
        <span className="text-ink-mute">/</span>
        <span className="text-[12px] text-ink font-medium">Pedidos</span>
      </div>

      <h1 className="font-serif text-[24px] font-normal text-ink mb-6">Meus pedidos</h1>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-[88px] rounded-[16px] bg-surface animate-pulse" />
          ))}
        </div>
      )}

      {!loading && !hasSession && (
        <div className="flex flex-col items-center py-16 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-surface border border-line flex items-center justify-center text-primary">
            <ShoppingBag size={22} strokeWidth={1.2} />
          </div>
          <p className="font-serif text-[18px] text-ink">Nenhum pedido encontrado</p>
          <p className="text-[12px] text-ink-soft max-w-[240px] leading-relaxed">
            Faça uma compra para acompanhar seus pedidos aqui.
          </p>
          <Link
            href="/loja"
            className="mt-2 h-11 px-6 rounded-full bg-primary text-paper text-[11px] font-medium tracking-[0.18em] uppercase flex items-center"
          >
            Explorar a loja
          </Link>
        </div>
      )}

      {!loading && hasSession && orders.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-surface border border-line flex items-center justify-center text-primary">
            <Package size={22} strokeWidth={1.2} />
          </div>
          <p className="font-serif text-[18px] text-ink">Você ainda não fez pedidos</p>
          <Link
            href="/loja"
            className="mt-2 h-11 px-6 rounded-full bg-primary text-paper text-[11px] font-medium tracking-[0.18em] uppercase flex items-center"
          >
            Explorar a loja
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/conta/pedidos/${order.id}`}
              className={cn(
                'flex items-center gap-4 px-4 py-4 rounded-[16px]',
                'bg-paper border border-line',
                'hover:border-primary/40 hover:bg-primary/[0.02] transition-colors'
              )}
            >
              {/* Thumbnail */}
              <div className="w-[52px] h-[64px] rounded-[10px] bg-surface border border-line overflow-hidden shrink-0">
                {order.firstPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={order.firstPhoto}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-mute">
                    <Package size={18} strokeWidth={1.2} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-ink-soft">{order.orderNumber}</span>
                  <span className="text-[11px] text-ink-soft">{formatDate(order.createdAt)}</span>
                </div>
                <p className="text-[13px] font-medium text-ink mt-1">
                  {order.itemCount} {order.itemCount === 1 ? 'peça' : 'peças'} · {brl(order.total, { decimals: true })}
                </p>
                <p className={cn(
                  'text-[11px] mt-0.5',
                  order.paymentStatus === 'paid'    ? 'text-success' :
                  order.paymentStatus === 'pending' ? 'text-warning' : 'text-ink-soft'
                )}>
                  {STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                  {order.paymentStatus === 'paid' && order.fulfillmentStatus !== 'pending' && (
                    <> · {FULFILLMENT_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus}</>
                  )}
                </p>
              </div>

              <ChevronRight size={16} className="text-ink-mute shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
