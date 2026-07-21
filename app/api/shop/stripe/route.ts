export const dynamic = 'force-dynamic';

/**
 * ONE TWO · POST /api/shop/stripe
 * Cria um PaymentIntent para o Stripe Elements.
 * Montante em centavos (BRL).
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCustomerSessionEmail } from '@/lib/shop/customer-session';
import { getOrderForPayment } from '@/lib/shop/orders-admin';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe não configurado.' }, { status: 503 });
  }

  try {
    const customerEmail = await getCustomerSessionEmail();
    if (!customerEmail) return NextResponse.json({ error: 'Sessão do cliente inválida.' }, { status: 401 });
    const body = await req.json().catch(() => null) as { orderId?: string } | null;
    if (!body?.orderId) return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });

    const order = await getOrderForPayment(body.orderId, customerEmail);
    if (!order || order.payment_method !== 'card' || order.payment_status !== 'pending') {
      return NextResponse.json({ error: 'Pedido indisponível para pagamento.' }, { status: 409 });
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: 'brl',
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order.id, orderNumber: order.order_number },
      receipt_email: order.customer_email,
    }, { idempotencyKey: `order-${order.id}` });
    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro no Stripe.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
