export const dynamic = 'force-dynamic';

/**
 * ONE TWO · POST /api/shop/webhooks
 * Recebe eventos do Stripe (payment_intent.succeeded).
 * Configura em: Stripe Dashboard → Webhooks → /api/shop/webhooks
 * Variável: STRIPE_WEBHOOK_SECRET
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendOrderConfirmationEmail } from '@/lib/shop/email';
import {
  claimWebhookEvent,
  finishWebhookEvent,
  getInternalOrderSummary,
  markOrderPaidVerified,
} from '@/lib/shop/orders-admin';

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
    const claim = await claimWebhookEvent('stripe', event.id);
    if (claim !== 'claimed') return NextResponse.json({ received: true, duplicate: true });

    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;
    try {
      if (!orderId) throw new Error('PaymentIntent sem orderId.');
      if (intent.currency !== 'brl') throw new Error('Moeda do pagamento inválida.');
      const paid = await markOrderPaidVerified(orderId, 'stripe', intent.id, intent.amount_received / 100);
      if (!paid.ok) throw new Error(paid.error);

      const order = await getInternalOrderSummary(orderId);
      if (order) await sendOrderConfirmationEmail(order);
      await finishWebhookEvent('stripe', event.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao processar webhook.';
      await finishWebhookEvent('stripe', event.id, message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
