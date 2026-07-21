export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  MercadoPagoConfig,
  Payment,
  WebhookSignatureValidator,
} from 'mercadopago';
import {
  claimWebhookEvent,
  finishWebhookEvent,
  getInternalOrderSummary,
  markOrderPaidVerified,
} from '@/lib/shop/orders-admin';
import { sendOrderConfirmationEmail } from '@/lib/shop/email';

export async function POST(request: NextRequest) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!accessToken || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook não configurado.' }, { status: 503 });
  }

  const dataId = request.nextUrl.searchParams.get('data.id');
  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get('x-signature'),
      xRequestId: request.headers.get('x-request-id'),
      dataId,
      secret: webhookSecret,
      toleranceSeconds: 300,
    });
  } catch {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { id?: string | number; action?: string; data?: { id?: string } } | null;
  const paymentId = dataId ?? body?.data?.id;
  if (!paymentId) return NextResponse.json({ error: 'Pagamento não informado.' }, { status: 400 });

  let claimedEventId: string | null = null;
  try {
    const payment = await new Payment(new MercadoPagoConfig({ accessToken })).get({ id: paymentId });
    if (payment.status !== 'approved') {
      return NextResponse.json({ received: true, status: payment.status });
    }

    const eventId = String(body?.id ?? `payment-${paymentId}-approved`);
    const claim = await claimWebhookEvent('mercadopago', eventId);
    if (claim !== 'claimed') return NextResponse.json({ received: true, duplicate: true });
    claimedEventId = eventId;

    const orderId = payment.external_reference;
    if (!orderId || payment.currency_id !== 'BRL' || payment.transaction_amount == null) {
      throw new Error('Dados do pagamento não correspondem a um pedido válido.');
    }

    const paid = await markOrderPaidVerified(
      orderId,
      'mercadopago',
      String(payment.id),
      Number(payment.transaction_amount)
    );
    if (!paid.ok) throw new Error(paid.error);

    const order = await getInternalOrderSummary(orderId);
    if (order) await sendOrderConfirmationEmail(order);
    await finishWebhookEvent('mercadopago', eventId);
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao processar webhook.';
    if (claimedEventId) await finishWebhookEvent('mercadopago', claimedEventId, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
