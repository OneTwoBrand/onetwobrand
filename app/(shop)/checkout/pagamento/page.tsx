/**
 * ONE TWO · /checkout/pagamento — Pagamento
 * Passo 3: Cartão (Stripe) · PIX (MercadoPago) · Boleto.
 * Lê dados do sessionStorage preenchidos no passo anterior.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CreditCard, QrCode, FileText } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore, type CartItem } from '@/lib/shop/cart-store';
import { createOrder, markOrderPaid } from '@/lib/shop/checkout-actions';
import { brl, cn } from '@/lib/utils';
import { CheckoutStepper } from '../CheckoutStepper';

const STEPS = ['Identificação', 'Entrega', 'Pagamento', 'Concluir'];

// loadStripe deve ser chamado só no browser — lazy singleton
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

export default function PagamentoPage() {
  const router   = useRouter();
  const cart     = useCartStore();
  const [session, setSession]       = useState<CheckoutSession | null>(null);
  const [method, setMethod]         = useState<PayMethod>('card');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    const raw = sessionStorage.getItem('ot_checkout');
    if (!raw) { router.replace('/checkout'); return; }
    setSession(JSON.parse(raw));
  }, [router]);

  if (cart.itemCount() === 0) { router.replace('/carrinho'); return null; }
  if (!session) return null;

  const sub   = cart.subtotal();
  const total = cart.total(session.shippingCost);

  // Cria PaymentIntent via API quando seleciona cartão
  async function initStripe() {
    if (clientSecret) return;
    setLoading(true);
    try {
      const res = await fetch('/api/shop/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total * 100), currency: 'brl' }),
      });
      const json = await res.json();
      setClientSecret(json.clientSecret ?? null);
    } catch {
      setError('Erro ao conectar com o gateway de pagamento.');
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
            {clientSecret && getStripePromise() ? (
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
                  session={session}
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

// ── Stripe form ──────────────────────────────────────────────────

function StripeForm({ session, cart, total, onError }: {
  session: CheckoutSession;
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

    // 1. Criar pedido
    const orderRes = await createOrder({
      customerName:    session.customer.name,
      customerEmail:   session.customer.email,
      customerPhone:   session.customer.phone,
      address:         session.address as Parameters<typeof createOrder>[0]['address'],
      shippingCarrier: session.shippingCarrier,
      shippingCost:    session.shippingCost,
      paymentMethod:   'card',
      couponCode:      cart.couponCode,
      couponDiscount:  cart.couponDiscount,
      items:           cart.items,
    });

    if (!orderRes.ok) { onError(orderRes.error); setPaying(false); return; }

    // 2. Confirmar pagamento via Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) { onError(error.message ?? 'Erro no pagamento.'); setPaying(false); return; }

    // 3. Marcar pedido como pago → dispara trigger que cria OP
    await markOrderPaid(orderRes.orderId, { stripePaymentIntentId: paymentIntent?.id });

    cart.clearCart();
    sessionStorage.removeItem('ot_checkout');
    router.push(`/checkout/sucesso/${orderRes.orderId}`);
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
        shippingCarrier: session.shippingCarrier,
        shippingCost:    session.shippingCost,
        paymentMethod:   'pix',
        couponCode:      cart.couponCode,
        couponDiscount:  cart.couponDiscount,
        items:           cart.items,
      });
      if (!orderRes.ok) { onError(orderRes.error); setLoading(false); return; }

      // 2. Gerar QR Code via API
      const res = await fetch('/api/shop/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderRes.orderId, amount: total, email: session.customer.email }),
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
            ? <img src={`data:image/png;base64,${pixData.qrCode}`} alt="QR Code PIX" className="w-44 h-44" />
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

  async function generateBoleto() {
    setLoading(true);
    try {
      const orderRes = await createOrder({
        customerName:    session.customer.name,
        customerEmail:   session.customer.email,
        customerPhone:   session.customer.phone,
        address:         session.address as Parameters<typeof createOrder>[0]['address'],
        shippingCarrier: session.shippingCarrier,
        shippingCost:    session.shippingCost,
        paymentMethod:   'boleto',
        couponCode:      cart.couponCode,
        couponDiscount:  cart.couponDiscount,
        items:           cart.items,
      });
      if (!orderRes.ok) { onError(orderRes.error); setLoading(false); return; }

      const res = await fetch('/api/shop/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderRes.orderId, amount: total, email: session.customer.email, method: 'boleto' }),
      });
      const json = await res.json();
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
