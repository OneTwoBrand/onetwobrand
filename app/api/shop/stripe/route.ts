export const dynamic = 'force-dynamic';

/**
 * ONE TWO · POST /api/shop/stripe
 * Cria um PaymentIntent para o Stripe Elements.
 * Montante em centavos (BRL).
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe não configurado.' }, { status: 503 });
  }

  const { amount, currency = 'brl' } = await req.json();
  if (!amount || amount < 50) {
    return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 });
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });
    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro no Stripe.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
