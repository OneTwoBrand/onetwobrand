/**
 * ONE TWO · /conta/pedidos/[id]
 * Detalhe do pedido: OrderProgress Realtime + timeline + fotos do atelier.
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Clock, MapPin, Package, Truck } from 'lucide-react';
import { getOrderDetail } from '@/lib/shop/checkout-actions';
import { OrderProgress } from '@/components/shop/OrderProgress';
import { brl } from '@/lib/utils';

function formatDate(iso: string, time = false) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    ...(time ? { timeStyle: 'short' } : {}),
    timeZone: 'America/Cuiaba',
  }).format(new Date(iso));
}

const PAYMENT_LABELS: Record<string, string> = {
  card:   'Cartão de crédito',
  pix:    'PIX',
  boleto: 'Boleto bancário',
};

export default async function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, error } = await getOrderDetail(id);

  if (!order && error) notFound();
  if (!order) notFound();

  const addrLine = order.shippingAddress
    ? `${order.shippingAddress.street}${order.shippingAddress.number ? ', ' + order.shippingAddress.number : ''}${order.shippingAddress.complement ? ' ' + order.shippingAddress.complement : ''} — ${order.shippingAddress.city}/${order.shippingAddress.state}`
    : null;

  return (
    <div className="max-w-lg mx-auto pt-4 pb-28 lg:pb-10 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/conta/pedidos" className="flex items-center gap-1 text-[12px] text-ink-soft hover:text-ink transition-colors">
          <ChevronLeft size={14} />
          Pedidos
        </Link>
        <span className="text-ink-mute">/</span>
        <span className="text-[12px] text-ink font-medium font-mono">{order.orderNumber}</span>
      </div>

      {/* Hero */}
      <div className="bg-paper border border-line rounded-[20px] p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.24em] uppercase text-ink-soft">Pedido</p>
            <h1 className="font-serif text-[22px] font-normal text-ink mt-0.5">
              {order.orderNumber}
            </h1>
            <p className="text-[11px] text-ink-soft mt-1">
              {formatDate(order.createdAt)} · {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-ink-soft">Total</p>
            <p className="font-serif text-[20px] text-ink">{brl(order.total, { decimals: true })}</p>
          </div>
        </div>

        {/* Progresso Realtime */}
        <div className="pt-3 border-t border-line">
          <OrderProgress
            orderId={order.id}
            initialProgress={order.progress}
          />
        </div>
      </div>

      {/* Itens */}
      <div className="bg-paper border border-line rounded-[20px] p-5">
        <p className="text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-4">Itens do pedido</p>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-[52px] h-[64px] rounded-[10px] bg-surface border border-line overflow-hidden shrink-0">
                {item.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photoUrl} alt={item.pieceName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-mute">
                    <Package size={16} strokeWidth={1.2} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-ink">{item.pieceName}</p>
                <p className="text-[11px] text-ink-soft mt-0.5">
                  Tam {item.size} · {item.qty}× {brl(item.unitPrice, { decimals: true })}
                </p>
              </div>
              <p className="text-[13px] font-medium text-ink shrink-0">
                {brl(item.qty * item.unitPrice, { decimals: true })}
              </p>
            </div>
          ))}
        </div>

        {/* Subtotais */}
        <div className="mt-4 pt-4 border-t border-line space-y-2">
          <div className="flex justify-between text-[12px]">
            <span className="text-ink-soft">Subtotal</span>
            <span className="text-ink">{brl(order.subtotal, { decimals: true })}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-[12px]">
              <span className="text-ink-soft">
                Desconto{order.couponCode ? ` (${order.couponCode})` : ''}
              </span>
              <span className="text-success">−{brl(order.discount, { decimals: true })}</span>
            </div>
          )}
          {order.shipping > 0 && (
            <div className="flex justify-between text-[12px]">
              <span className="text-ink-soft">Frete{order.shippingCarrier ? ` (${order.shippingCarrier})` : ''}</span>
              <span className="text-ink">{brl(order.shipping, { decimals: true })}</span>
            </div>
          )}
          {order.shipping === 0 && (
            <div className="flex justify-between text-[12px]">
              <span className="text-ink-soft">Frete</span>
              <span className="text-success">Grátis</span>
            </div>
          )}
          <div className="flex justify-between text-[13px] font-medium pt-1 border-t border-line">
            <span className="text-ink">Total</span>
            <span className="text-ink">{brl(order.total, { decimals: true })}</span>
          </div>
        </div>
      </div>

      {/* Entrega */}
      {(addrLine || order.trackingCode) && (
        <div className="bg-paper border border-line rounded-[20px] p-5 space-y-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-ink-soft">Entrega</p>
          {addrLine && (
            <div className="flex items-start gap-3">
              <MapPin size={14} className="text-ink-soft mt-0.5 shrink-0" />
              <p className="text-[12px] text-ink leading-relaxed">{addrLine}</p>
            </div>
          )}
          {order.trackingCode && (
            <div className="flex items-start gap-3">
              <Truck size={14} className="text-ink-soft mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] text-ink-soft">Código de rastreio</p>
                <p className="text-[12px] font-mono text-ink mt-0.5">{order.trackingCode}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fotos do atelier */}
      {order.attachments.length > 0 && (
        <div className="bg-paper border border-line rounded-[20px] p-5">
          <p className="text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-4">
            Fotos do atelier ({order.attachments.length})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {order.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-[10px] overflow-hidden bg-surface border border-line hover:opacity-80 transition-opacity"
              >
                {att.mimeType?.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={att.url} alt={att.filename ?? 'Foto do atelier'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-mute text-[10px]">
                    {att.filename ?? 'Arquivo'}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Timeline da OP */}
      {order.opHistory.length > 0 && (
        <div className="bg-paper border border-line rounded-[20px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-ink-soft" />
            <p className="text-[10px] tracking-[0.22em] uppercase text-ink-soft">Histórico de produção</p>
          </div>
          <div className="space-y-4">
            {order.opHistory.map((entry, i) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  {i < order.opHistory.length - 1 && (
                    <div className="w-px flex-1 bg-line mt-1" />
                  )}
                </div>
                <div className="pb-4 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-medium text-ink">{entry.type}</span>
                    <span className="text-[10px] text-ink-soft shrink-0">
                      {formatDate(entry.createdAt, true)}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-[12px] text-ink-soft mt-1 leading-relaxed">{entry.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
