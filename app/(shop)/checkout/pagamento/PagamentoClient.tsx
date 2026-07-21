'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CreditCard, QrCode, FileText } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore, type CartItem } from '@/lib/shop/cart-store';
import { createOrder } from '@/lib/shop/checkout-actions';
import { brl, cn } from '@/lib/utils';
import { CheckoutStepper } from '../CheckoutStepper';
import { formatCpf } from '@/lib/input-masks';

const STEPS = ['Identificação', 'Entrega', 'Pagamento', 'Concluir'];

let stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (typeof window === 'undefined') return null;
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

type PayMethod = 'card' | 'pix' | 'boleto';

type CheckoutSession = {
  customer:        { name: string; email: string; phone: string };
  address:         Record<string, string>;
  shippingId:      string;
  shippingCost:    number;
  shippingCarrier: string;
};

type Props = {
  waEnabled: boolean;
  waNumber: string | null;
};

export function PagamentoClient({ waEnabled, waNumber }: Props) {
  const router   = useRouter();
  const cart     = useCartStore();
  const [session, setSession]           = useState<CheckoutSession | null>(null);
  const [method, setMethod]             = useState<PayMethod>('card');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeOrderId, setStripeOrderId] = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    queueMicrotask(() => {
      const raw = sessionStorage.getItem('ot_checkout');
      if (!raw) { router.replace('/checkout'); return; }
      try { setSession(JSON.parse(raw)); }
      catch { router.replace('/checkout'); }
    });
  }, [router]);

  const cartItemCount = cart.itemCount();
  useEffect(() => {
    if (cartItemCount === 0) router.replace('/carrinho');
  }, [cartItemCount, router]);

  if (cartItemCount === 0) return null;
  if (!session) return null;

  const total = cart.total(session.shippingCost);

  // WhatsApp ligado: checkout exclusivamente por WhatsApp.
  if (waEnabled && waNumber) {
    return (
      <div className="max-w-[520px] mx-auto">
        <button
          type="button"
          onClick={() => router.push('/checkout')}
          className="flex items-center gap-1 text-[11px] font-medium tracking-[0.16em] uppercase text-ink-mute mb-5 hover:text-ink transition-colors"
        >
          <ChevronLeft size={14} /> Entrega
        </button>

        <CheckoutStepper steps={STEPS} active={3} />

        <div className="mt-6 flex flex-col gap-5">
          <h1 className="font-serif text-[22px] font-light text-ink">Finalizar pedido</h1>
          <WhatsAppCheckout session={session} cart={cart} total={total} waNumber={waNumber} />
        </div>
      </div>
    );
  }

  // Cria PaymentIntent via API quando seleciona cartão
  async function initStripe() {
    if (clientSecret || !session) return;
    setLoading(true);
    try {
      const orderRes = await createOrder({
        customerName: session.customer.name,
        customerEmail: session.customer.email,
        customerPhone: session.customer.phone,
        address: session.address as Parameters<typeof createOrder>[0]['address'],
        shippingId: session.shippingId,
        paymentMethod: 'card',
        couponCode: cart.couponCode,
        items: cart.items,
      });
      if (!orderRes.ok) {
        setError(orderRes.error);
        return;
      }

      const res = await fetch('/api/shop/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderRes.orderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erro ao iniciar o pagamento.');
      setStripeOrderId(orderRes.orderId);
      setClientSecret(json.clientSecret ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao conectar com o gateway de pagamento.');
    } finally {
      setLoading(false);
    }
  }

  function selectMethod(m: PayMethod) {
    setMethod(m);
    if (m === 'card') initStripe();
  }

  const methodBtns: Array<{ id: PayMethod; label: string; icon: React.ReactNode; note?: string }> = [
    { id: 'card',   label: 'Cartão de crédito', icon: <CreditCard size={16} />,  note: 'Visa, Master, Elo' },
    { id: 'pix',    label: 'PIX',               icon: <QrCode size={16} />,      note: '5% off · à vista' },
    { id: 'boleto', label: 'Boleto',             icon: <FileText size={16} />,    note: 'Vence em 3 dias úteis' },
  ];

  return (
    <div className="max-w-[520px] mx-auto">
      <button
        type="button"
        onClick={() => router.push('/checkout')}
        className="flex items-center gap-1 text-[11px] font-medium tracking-[0.16em] uppercase text-ink-mute mb-5 hover:text-ink transition-colors"
      >
        <ChevronLeft size={14} /> Entrega
      </button>

      <CheckoutStepper steps={STEPS} active={3} />

      <div className="mt-6 flex flex-col gap-5">
        <h1 className="font-serif text-[22px] font-light text-ink">Pagamento</h1>

        {/* Badge segurança */}
        <div className="bg-success-soft rounded-[12px] px-4 py-3 flex items-center gap-2">
          <span className="text-success text-[18px]">✓</span>
          <span className="text-[11px] text-success leading-[1.4]">
            Pagamento processado por Stripe e MercadoPago. Seus dados não são armazenados pela loja.
          </span>
        </div>

        {/* Seleção de método */}
        <div>
          <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2.5">Forma de pagamento</p>
          <div className="flex flex-col gap-2">
            {methodBtns.map(({ id, label, icon, note }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectMethod(id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 rounded-[12px] border text-left transition-colors',
                  method === id ? 'border-primary bg-primary-soft' : 'border-line bg-paper hover:border-ink/30'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0',
                  method === id ? 'border-primary' : 'border-ink-mute'
                )}>
                  {method === id && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className={cn('text-ink', method === id ? '' : 'text-ink-soft')}>{icon}</span>
                <div className="flex-1">
                  <span className="text-[13px] font-medium text-ink">{label}</span>
                  {note && <span className="text-[11px] text-ink-soft ml-2">{note}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Formulário de cartão via Stripe Elements */}
        {method === 'card' && (
          <div className="flex flex-col gap-4">
            <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft">Dados do cartão</p>
            {loading && <p className="text-[12px] text-ink-mute">Carregando formulário…</p>}
            {clientSecret && stripeOrderId && getStripePromise() ? (
              <Elements
                stripe={getStripePromise()}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'flat',
                    variables: {
                      colorPrimary:     '#6F1628',
                      colorBackground:  '#FBF6E4',
                      colorText:        '#3D1A1A',
                      colorDanger:      '#9A3434',
                      fontFamily:       'Montserrat, sans-serif',
                      borderRadius:     '12px',
                      spacingUnit:      '4px',
                    },
                  },
                }}
              >
                <StripeForm
                  orderId={stripeOrderId}
                  cart={cart}
                  total={total}
                  onError={setError}
                />
              </Elements>
            ) : !loading && (
              <p className="text-[11px] text-ink-mute">Configure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY para habilitar pagamento por cartão.</p>
            )}
          </div>
        )}

        {/* PIX */}
        {method === 'pix' && (
          <PixSection
            session={session}
            cart={cart}
            total={total * 0.95}
            onError={setError}
          />
        )}

        {/* Boleto */}
        {method === 'boleto' && (
          <BoletoSection
            session={session}
            cart={cart}
            total={total}
            onError={setError}
          />
        )}

        {error && <p className="text-[12px] text-danger rounded-[10px] bg-danger-soft px-4 py-3">{error}</p>}
      </div>
    </div>
  );
}

// ── WhatsApp checkout ────────────────────────────────────────────
// Registra a negociação no painel antes de abrir o wa.me.

function WhatsAppCheckout({ session, cart, total, waNumber }: {
  session: CheckoutSession;
  cart: { items: CartItem[]; clearCart: () => void };
  total: number;
  waNumber: string;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [waError, setWaError] = useState('');

  const waHref = `https://wa.me/55${waNumber.replace(/\D/g, '')}`;
  const itemLines = cart.items
    .map((item) => `• ${item.name}${item.size ? ` (${item.size})` : ''} × ${item.qty} — ${brl(item.price * item.qty)}`)
    .join('\n');
  const msg = [
    `Olá! Gostaria de negociar meu pedido pelo atelier ONE TWO. 🛍️`,
    ``,
    `*Meus dados:*`,
    `Nome: ${session.customer.name}`,
    `E-mail: ${session.customer.email}`,
    `Telefone: ${session.customer.phone}`,
    ``,
    `*Itens da sacola:*`,
    itemLines,
    ``,
    `*Frete:* ${session.shippingCarrier} — ${session.shippingCost === 0 ? 'Grátis' : brl(session.shippingCost)}`,
    `*Total: ${brl(total)}*`,
  ].join('\n');

  async function handleNegotiate() {
    setSending(true);
    setWaError('');

    // Registra a negociação no painel ANTES de abrir o WhatsApp.
    // Abre uma aba imediatamente (gesto do usuário) para não ser bloqueada por popup;
    // navega após a confirmação do registro.
    const waWindow = window.open('', '_blank');
    try {
      const res = await fetch('/api/shop/whatsapp-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo:            'sacola',
          clienteNome:     session.customer.name,
          clienteEmail:    session.customer.email,
          clienteTelefone: session.customer.phone,
          total,
          url:             typeof window !== 'undefined' ? window.location.origin + '/carrinho' : null,
          itens: cart.items.map((item) => ({
            nome:    item.name,
            tamanho: item.size ?? null,
            qty:     item.qty,
            preco:   item.price,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        waWindow?.close();
        setWaError(json.error ?? 'Não foi possível registrar a negociação. Tente novamente.');
        setSending(false);
        return;
      }
    } catch {
      waWindow?.close();
      setWaError('Erro de conexão. Tente novamente.');
      setSending(false);
      return;
    }

    const target = `${waHref}?text=${encodeURIComponent(msg)}`;
    if (waWindow) {
      waWindow.location.href = target;
    } else {
      window.open(target, '_blank', 'noopener,noreferrer');
    }

    cart.clearCart();
    sessionStorage.removeItem('ot_checkout');
    router.push('/loja');
  }

  return (
    <div className="rounded-[16px] border border-line bg-paper p-5 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-medium tracking-[0.20em] uppercase text-ink-soft">Sua sacola</p>
        <ul className="mt-1 space-y-1">
          {cart.items.map((item) => (
            <li key={`${item.pieceId}-${item.size}`} className="flex justify-between text-[12px]">
              <span className="text-ink">{item.name}{item.size ? ` · ${item.size}` : ''} × {item.qty}</span>
              <span className="text-ink-soft">{brl(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between mt-2 pt-2 border-t border-line text-[13px] font-medium">
          <span className="text-ink">Total</span>
          <span className="font-serif text-[18px] text-ink">{brl(total)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleNegotiate}
        disabled={sending}
        className="flex items-center justify-center gap-3 h-[52px] rounded-full bg-[#25D366] text-white text-[12px] font-medium tracking-[0.16em] uppercase hover:bg-[#1ebe5d] disabled:opacity-50 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        {sending ? 'Abrindo WhatsApp…' : 'Negociar pelo WhatsApp'}
      </button>

      {waError && <p className="text-[12px] text-danger rounded-[10px] bg-danger-soft px-4 py-3">{waError}</p>}

      <p className="text-[11px] text-ink-soft text-center leading-relaxed">
        Ao confirmar, sua negociação é registrada para a vendedora e você é redirecionada ao WhatsApp com os dados do pedido já preenchidos.
      </p>
    </div>
  );
}

// ── Stripe form ──────────────────────────────────────────────────

function StripeForm({ orderId, cart, total, onError }: {
  orderId: string;
  cart: { items: CartItem[]; couponCode: string | null; couponDiscount: number; clearCart: () => void };
  total: number;
  onError: (e: string) => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const router   = useRouter();
  const [paying, setPaying] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);

    // A confirmação financeira é feita exclusivamente pelo webhook da Stripe.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) { onError(error.message ?? 'Erro no pagamento.'); setPaying(false); return; }

    if (!paymentIntent?.id) { onError('Pagamento não confirmado pela Stripe.'); setPaying(false); return; }

    cart.clearCart();
    sessionStorage.removeItem('ot_checkout');
    router.push(`/checkout/sucesso/${orderId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      <div className="sticky bottom-0 -mx-5 px-5 py-3 bg-bg/95 backdrop-blur-sm border-t border-line lg:static lg:mx-0 lg:px-0 lg:border-0 lg:bg-transparent"
           style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-[10px] font-medium tracking-[0.20em] uppercase text-ink-soft">Total</span>
          <span className="font-serif text-[18px] text-ink">{brl(total, { decimals: true })}</span>
        </div>
        <button
          type="submit"
          disabled={paying || !stripe}
          className="w-full h-[52px] rounded-full bg-primary text-paper text-[12px] font-medium tracking-[0.20em] uppercase hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {paying ? 'Processando…' : 'Confirmar pagamento'}
        </button>
      </div>
      <div className="h-24 lg:hidden" />
    </form>
  );
}

// ── PIX section ──────────────────────────────────────────────────

function PixSection({ session, cart, total, onError }: {
  session: CheckoutSession;
  cart: { items: CartItem[]; couponCode: string | null; couponDiscount: number; clearCart: () => void };
  total: number;
  onError: (e: string) => void;
}) {
  const router    = useRouter();
  const [loading, setLoading]   = useState(false);
  const [pixData, setPixData]   = useState<{ qrCode: string; pixKey: string; orderId: string } | null>(null);

  async function generatePix() {
    setLoading(true);
    try {
      // 1. Criar pedido
      const orderRes = await createOrder({
        customerName:    session.customer.name,
        customerEmail:   session.customer.email,
        customerPhone:   session.customer.phone,
        address:         session.address as Parameters<typeof createOrder>[0]['address'],
        shippingId:      session.shippingId,
        paymentMethod:   'pix',
        couponCode:      cart.couponCode,
        items:           cart.items,
      });
      if (!orderRes.ok) { onError(orderRes.error); setLoading(false); return; }

      // 2. Gerar QR Code via API
      const res = await fetch('/api/shop/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderRes.orderId, method: 'pix' }),
      });
      const json = await res.json();
      if (json.error) { onError(json.error); setLoading(false); return; }

      setPixData({ qrCode: json.qrCodeBase64 ?? '', pixKey: json.pixCopyPaste ?? '', orderId: orderRes.orderId });
      cart.clearCart();
      sessionStorage.removeItem('ot_checkout');
    } catch (e) {
      onError(String(e));
    } finally {
      setLoading(false);
    }
  }

  if (pixData) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-48 h-48 bg-white rounded-[16px] flex items-center justify-center border border-line">
          {pixData.qrCode
            ? <Image src={`data:image/png;base64,${pixData.qrCode}`} alt="QR Code PIX" width={176} height={176} unoptimized />
            : <QrCode size={80} className="text-ink-mute" />
          }
        </div>
        {pixData.pixKey && (
          <div className="w-full">
            <p className="text-[10px] font-medium tracking-[0.20em] uppercase text-ink-soft mb-2 text-center">Ou copie o código</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={pixData.pixKey}
                className="flex-1 h-11 bg-surface border border-line rounded-[10px] px-3 text-[11px] text-ink-soft"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(pixData.pixKey)}
                className="h-11 px-4 rounded-[10px] bg-ink text-paper text-[11px] font-medium tracking-[0.14em] uppercase"
              >
                Copiar
              </button>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => router.push(`/checkout/sucesso/${pixData.orderId}`)}
          className="mt-2 text-[11px] font-medium tracking-[0.16em] uppercase text-ink-mute underline"
        >
          Já paguei — ver pedido
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-ink-soft leading-[1.55]">
        Você receberá um QR Code para pagar via PIX. O pagamento é confirmado em segundos.
      </p>
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] font-medium tracking-[0.20em] uppercase text-ink-soft">Total com 5% off</span>
        <span className="font-serif text-[18px] text-success">{brl(total, { decimals: true })}</span>
      </div>
      <button
        type="button"
        onClick={generatePix}
        disabled={loading}
        className="w-full h-[52px] rounded-full bg-primary text-paper text-[12px] font-medium tracking-[0.20em] uppercase hover:bg-primary-hover disabled:opacity-50 transition-colors"
      >
        {loading ? 'Gerando QR Code…' : 'Gerar QR Code PIX'}
      </button>
    </div>
  );
}

// ── Boleto section ───────────────────────────────────────────────

function BoletoSection({ session, cart, total, onError }: {
  session: CheckoutSession;
  cart: { items: CartItem[]; couponCode: string | null; couponDiscount: number; clearCart: () => void };
  total: number;
  onError: (e: string) => void;
}) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [cpf, setCpf] = useState('');

  async function generateBoleto() {
    if (cpf.replace(/\D/g, '').length !== 11) {
      onError('Informe um CPF válido para emitir o boleto.');
      return;
    }
    setLoading(true);
    try {
      const orderRes = await createOrder({
        customerName:    session.customer.name,
        customerEmail:   session.customer.email,
        customerPhone:   session.customer.phone,
        address:         session.address as Parameters<typeof createOrder>[0]['address'],
        shippingId:      session.shippingId,
        paymentMethod:   'boleto',
        couponCode:      cart.couponCode,
        items:           cart.items,
      });
      if (!orderRes.ok) { onError(orderRes.error); setLoading(false); return; }

      const res = await fetch('/api/shop/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderRes.orderId, method: 'boleto', document: cpf }),
      });
      const json = await res.json();
      if (!res.ok || json.error) { onError(json.error ?? 'Não foi possível emitir o boleto.'); return; }
      if (json.boletoUrl) window.open(json.boletoUrl, '_blank');

      cart.clearCart();
      sessionStorage.removeItem('ot_checkout');
      router.push(`/checkout/sucesso/${orderRes.orderId}`);
    } catch (e) {
      onError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-ink-soft leading-[1.55]">
        O boleto será gerado em PDF e enviado para o seu e-mail. Vence em 3 dias úteis.
      </p>
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] font-medium tracking-[0.20em] uppercase text-ink-soft">Total</span>
        <span className="font-serif text-[18px] text-ink">{brl(total, { decimals: true })}</span>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-medium tracking-[0.20em] uppercase text-ink-soft">CPF do pagador</span>
        <input
          value={cpf}
          onChange={(event) => setCpf(formatCpf(event.target.value))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          className="h-[52px] rounded-[12px] border border-line bg-paper px-4 text-[16px] text-ink outline-none focus:border-primary"
        />
      </label>
      <button
        type="button"
        onClick={generateBoleto}
        disabled={loading}
        className="w-full h-[52px] rounded-full bg-primary text-paper text-[12px] font-medium tracking-[0.20em] uppercase hover:bg-primary-hover disabled:opacity-50 transition-colors"
      >
        {loading ? 'Gerando boleto…' : 'Gerar boleto'}
      </button>
    </div>
  );
}
