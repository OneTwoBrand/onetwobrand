export const dynamic = 'force-dynamic';

/**
 * ONE TWO · POST /api/shop/webhooks
 * Recebe eventos do Stripe (payment_intent.succeeded).
 * Configura em: Stripe Dashboard → Webhooks → /api/shop/webhooks
 * Variável: STRIPE_WEBHOOK_SECRET
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { markOrderPaid } from '@/lib/shop/checkout-actions';
import { sendOrderConfirmationEmail } from '@/lib/shop/email';
import { getOrderSummary } from '@/lib/shop/checkout-actions';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook não configurado.' }, { status: 503 });
  }

  const body      = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;
    if (orderId) {
      await markOrderPaid(orderId, { stripePaymentIntentId: intent.id });

      // Enviar e-mail de confirmação
      const { order } = await getOrderSummary(orderId);
      if (order) await sendOrderConfirmationEmail(order);
    }
  }

  return NextResponse.json({ received: true });
}
