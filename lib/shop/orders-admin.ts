import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type InternalOrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  items: Array<{
    pieceName: string;
    size: string;
    qty: number;
    unitPrice: number;
    photoUrl: string | null;
  }>;
  createdAt: string;
};

export async function getInternalOrderSummary(orderId: string): Promise<InternalOrderSummary | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_email,
      total, payment_method, payment_status, fulfillment_status, created_at,
      order_items(piece_name, size, qty, unit_price, photo_url)
    `)
    .eq('id', orderId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    orderNumber: data.order_number,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    total: Number(data.total),
    paymentMethod: data.payment_method,
    paymentStatus: data.payment_status,
    fulfillmentStatus: data.fulfillment_status,
    createdAt: data.created_at,
    items: (data.order_items as Array<{
      piece_name: string; size: string; qty: number; unit_price: number; photo_url: string | null;
    }>).map((item) => ({
      pieceName: item.piece_name,
      size: item.size,
      qty: item.qty,
      unitPrice: Number(item.unit_price),
      photoUrl: item.photo_url,
    })),
  };
}

export async function getOrderForPayment(orderId: string, customerEmail: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select('id, order_number, customer_email, customer_name, total, payment_method, payment_status')
    .eq('id', orderId)
    .eq('customer_email', customerEmail)
    .maybeSingle();
  if (error || !data) return null;
  return { ...data, total: Number(data.total) };
}

export async function markOrderPaidVerified(
  orderId: string,
  provider: 'stripe' | 'mercadopago',
  paymentId: string,
  paidAmount: number
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id, total, payment_status')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError || !order) return { ok: false, error: 'Pedido não encontrado.' };
  if (Math.abs(Number(order.total) - paidAmount) > 0.009) {
    return { ok: false, error: 'Valor recebido não corresponde ao pedido.' };
  }
  if (order.payment_status === 'paid') return { ok: true };

  const patch = provider === 'stripe'
    ? { payment_status: 'paid', stripe_payment_intent_id: paymentId }
    : { payment_status: 'paid', mercadopago_payment_id: paymentId };

  const { error } = await admin.from('orders').update(patch).eq('id', orderId).eq('payment_status', 'pending');
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function claimWebhookEvent(
  provider: 'stripe' | 'mercadopago',
  eventId: string
): Promise<'claimed' | 'processed' | 'in_progress'> {
  const admin = createAdminClient();
  const { error } = await admin.from('payment_webhook_events').insert({
    provider,
    event_id: eventId,
    status: 'processing',
    error: null,
  });
  if (!error) return 'claimed';
  if (error.code !== '23505') throw new Error(error.message);

  const { data: existing } = await admin
    .from('payment_webhook_events')
    .select('status')
    .eq('provider', provider)
    .eq('event_id', eventId)
    .maybeSingle();
  if (existing?.status === 'processed') return 'processed';
  if (existing?.status === 'processing') return 'in_progress';

  const { data: reclaimed, error: reclaimError } = await admin
    .from('payment_webhook_events')
    .update({ status: 'processing', error: null, updated_at: new Date().toISOString() })
    .eq('provider', provider)
    .eq('event_id', eventId)
    .eq('status', 'failed')
    .select('event_id')
    .maybeSingle();
  if (reclaimError) throw new Error(reclaimError.message);
  return reclaimed ? 'claimed' : 'in_progress';
}

export async function finishWebhookEvent(
  provider: 'stripe' | 'mercadopago',
  eventId: string,
  error?: string
): Promise<void> {
  const admin = createAdminClient();
  await admin.from('payment_webhook_events').update({
    status: error ? 'failed' : 'processed',
    error: error ?? null,
    updated_at: new Date().toISOString(),
    processed_at: error ? null : new Date().toISOString(),
  }).eq('provider', provider).eq('event_id', eventId);
}
