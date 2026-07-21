/**
 * ONE TWO · /checkout/sucesso/[orderId] — Pedido confirmado
 * Server Component: busca o pedido e exibe confirmação.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock3 } from 'lucide-react';
import { getOrderSummary } from '@/lib/shop/checkout-actions';
import { brl } from '@/lib/utils';
import { CheckoutStepper } from '../../CheckoutStepper';

export const metadata: Metadata = { title: 'Pedido confirmado · ONE TWO' };

const STEPS = ['Identificação', 'Entrega', 'Pagamento', 'Concluir'];

const STAGE_LABEL: Record<string, string> = {
  pending:       'Recebido',
  in_production: 'Em produção',
  shipped:       'Enviado',
  delivered:     'Entregue',
};

export default async function SucessoPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const { order } = await getOrderSummary(orderId);

  if (!order) {
    return (
      <div className="max-w-[520px] mx-auto text-center py-20">
        <p className="font-serif text-[20px] text-ink">Pedido não encontrado.</p>
        <Link href="/loja" className="mt-4 inline-block text-[11px] font-medium tracking-[0.16em] uppercase text-ink-mute underline">
          Voltar à loja
        </Link>
      </div>
    );
  }

  const firstName = order.customerName.split(' ')[0];
  const stage     = STAGE_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus;
  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="max-w-[520px] mx-auto">
      <CheckoutStepper steps={STEPS} active={4} />

      <div className="flex flex-col items-center gap-3 mt-8 text-center">
        {/* Ícone */}
        <div className="w-[92px] h-[92px] rounded-full bg-success-soft flex items-center justify-center">
          {isPaid
            ? <CheckCircle2 size={44} className="text-success" strokeWidth={1.5} />
            : <Clock3 size={44} className="text-warning" strokeWidth={1.5} />}
        </div>

        <div>
          <p className={`text-[10px] font-medium tracking-[0.24em] uppercase mb-1 ${isPaid ? 'text-success' : 'text-warning'}`}>
            {isPaid ? 'Pagamento aprovado' : 'Pedido recebido, pagamento pendente'}
          </p>
          <h1 className="font-serif text-[30px] font-light text-ink leading-[1.1]">
            Obrigada,<br /><em>{firstName}.</em>
          </h1>
        </div>

        <p className="text-[13px] text-ink-soft leading-[1.6] max-w-[300px]">
          {isPaid
            ? 'Seu pedido entrou no fluxo de produção do atelier. Acompanhe o status em tempo real.'
            : 'Assim que o pagamento for confirmado, seu pedido entrará no fluxo de produção.'}
        </p>
      </div>

      {/* Resumo do pedido */}
      <div className="mt-6 rounded-[18px] bg-paper border border-line overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <span className="text-[10px] font-medium tracking-[0.22em] uppercase text-ink-soft">
            Pedido {order.orderNumber}
          </span>
          <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-primary bg-primary-soft px-2.5 py-1 rounded-full">
            {stage}
          </span>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] text-ink">{item.pieceName}</p>
                <p className="text-[11px] text-ink-mute">Tam {item.size} · {item.qty}×</p>
              </div>
              <span className="text-[13px] text-ink shrink-0">{brl(item.unitPrice * item.qty, { decimals: true })}</span>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-line flex items-baseline justify-between">
          <span className="text-[10px] font-medium tracking-[0.22em] uppercase text-ink-soft">Total</span>
          <span className="font-serif text-[22px] text-ink">{brl(order.total, { decimals: true })}</span>
        </div>
      </div>

      {/* Confirmação por e-mail */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="text-[11px] text-ink-mute">✉</span>
        <span className="text-[11px] text-ink-mute">Confirmação enviada para {order.customerEmail}</span>
      </div>

      {/* CTAs */}
      <div className="mt-6 flex flex-col gap-2.5">
        <Link
          href={`/conta/pedidos`}
          className="flex items-center justify-center h-[52px] rounded-full bg-primary text-paper text-[12px] font-medium tracking-[0.20em] uppercase hover:bg-primary-hover transition-colors"
        >
          Acompanhar pedido
        </Link>
        <Link
          href="/loja"
          className="flex items-center justify-center h-[52px] rounded-full border border-line text-[12px] font-medium tracking-[0.20em] uppercase text-ink hover:bg-ink/5 transition-colors"
        >
          Continuar comprando
        </Link>
      </div>

      <div className="h-24 lg:hidden" />
    </div>
  );
}
