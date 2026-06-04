/**
 * ONE TWO · Checkout server actions
 * Cria o pedido, valida cupom, atualiza payment_status.
 * Usa createAdminClient() para contornar RLS em operações de sistema.
 */
'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import type { CartItem } from './cart-store';

// ── Tipos ────────────────────────────────────────────────────────

export type CheckoutAddress = {
  label:      string;
  street:     string;
  number:     string;
  complement: string;
  district:   string;
  city:       string;
  state:      string;
  cep:        string;
};

export type CheckoutPayload = {
  customerName:  string;
  customerEmail: string;
  customerPhone: string;
  address:       CheckoutAddress;
  shippingCarrier: string;
  shippingCost:  number;
  paymentMethod: 'card' | 'pix' | 'boleto';
  couponCode:    string | null;
  couponDiscount: number;
  items:         CartItem[];
};

export type CreateOrderResult =
  | { ok: true;  orderId: string; orderNumber: string; total: number }
  | { ok: false; error: string };

// ── Criar pedido ─────────────────────────────────────────────────

export async function createOrder(payload: CheckoutPayload): Promise<CreateOrderResult> {
  const supabase = createAdminClient();

  const subtotal = payload.items.reduce((s, i) => s + i.price * i.qty, 0);
  const total    = Math.max(0, subtotal - payload.couponDiscount + payload.shippingCost);

  try {
    // 1. Upsert customer
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .upsert(
        { name: payload.customerName, email: payload.customerEmail, phone: payload.customerPhone },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (custErr || !customer) {
      return { ok: false, error: custErr?.message ?? 'Erro ao registrar cliente.' };
    }

    // 2. Upsert address
    const { data: address, error: addrErr } = await supabase
      .from('addresses')
      .insert({
        customer_id: customer.id,
        ...payload.address,
        is_default: true,
      })
      .select('id')
      .single();

    if (addrErr || !address) {
      return { ok: false, error: addrErr?.message ?? 'Erro ao salvar endereço.' };
    }

    // 3. Gerar order_number via função SQL
    const { data: numRow } = await supabase.rpc('next_order_number');
    const orderNumber = numRow as string;

    // 4. Criar order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number:        orderNumber,
        customer_id:         customer.id,
        customer_name:       payload.customerName,
        customer_email:      payload.customerEmail,
        subtotal,
        discount:            payload.couponDiscount,
        shipping:            payload.shippingCost,
        total,
        coupon_code:         payload.couponCode,
        payment_method:      payload.paymentMethod,
        payment_status:      'pending',
        shipping_address_id: address.id,
        shipping_carrier:    payload.shippingCarrier,
      })
      .select('id, order_number, total')
      .single();

    if (orderErr || !order) {
      return { ok: false, error: orderErr?.message ?? 'Erro ao criar pedido.' };
    }

    // 5. Inserir order_items
    const itemsPayload = payload.items.map((item) => ({
      order_id:   order.id,
      piece_id:   item.pieceId,
      piece_name: item.name,
      size:       item.size,
      color:      item.color,
      qty:        item.qty,
      unit_price: item.price,
      photo_url:  item.photoUrl,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload);
    if (itemsErr) {
      return { ok: false, error: itemsErr.message };
    }

    return { ok: true, orderId: order.id, orderNumber: order.order_number, total: order.total };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro inesperado.' };
  }
}

// ── Marcar pedido como pago (chamado pelo webhook) ───────────────

export async function markOrderPaid(
  orderId: string,
  opts: { stripePaymentIntentId?: string; mercadopagoPaymentId?: string }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('orders')
    .update({
      payment_status:              'paid',
      stripe_payment_intent_id:    opts.stripePaymentIntentId ?? null,
      mercadopago_payment_id:      opts.mercadopagoPaymentId  ?? null,
    })
    .eq('id', orderId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Validar cupom ────────────────────────────────────────────────

export type CouponResult =
  | { ok: true;  code: string; kind: 'percent' | 'fixed'; value: number; discount: number }
  | { ok: false; error: string };

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('coupons')
    .select('code, kind, value, min_subtotal, expires_at, max_uses, uses, active')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) return { ok: false, error: 'Cupom não encontrado.' };
  if (!data.active) return { ok: false, error: 'Cupom inativo.' };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { ok: false, error: 'Cupom expirado.' };
  if (data.max_uses !== null && data.uses >= data.max_uses) return { ok: false, error: 'Cupom esgotado.' };
  if (subtotal < data.min_subtotal) return { ok: false, error: `Subtotal mínimo: R$ ${data.min_subtotal}.` };

  const discount =
    data.kind === 'percent'
      ? Math.round((subtotal * data.value) / 100 * 100) / 100
      : Math.min(data.value, subtotal);

  return { ok: true, code: data.code, kind: data.kind, value: data.value, discount };
}

// ── Buscar progresso de OP para o cliente ────────────────────────

export type OrderProgress = {
  opId:        string;
  opNumber:    string;
  opStatus:    string;
  stageLabel:  string;
  stageKey:    string;
  progressPct: number;
  updatedAt:   string;
};

export async function getOrderProgress(
  orderId: string
): Promise<{ progress: OrderProgress[]; error?: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('shop_order_progress', { p_order_id: orderId });
  if (error || !data) return { progress: [], error: error?.message };

  const rows = data as Array<{
    op_id: string; op_number: string; op_status: string;
    stage_label: string; stage_key: string; progress_pct: number; updated_at: string;
  }>;

  return {
    progress: rows.map((r) => ({
      opId:        r.op_id,
      opNumber:    r.op_number,
      opStatus:    r.op_status,
      stageLabel:  r.stage_label,
      stageKey:    r.stage_key,
      progressPct: r.progress_pct,
      updatedAt:   r.updated_at,
    })),
  };
}

// ── Buscar pedidos do cliente (Minha Conta) ──────────────────────

export type CustomerOrderItem = {
  id:                string;
  orderNumber:       string;
  total:             number;
  paymentStatus:     string;
  fulfillmentStatus: string;
  paymentMethod:     string;
  itemCount:         number;
  firstPhoto:        string | null;
  createdAt:         string;
};

export async function getCustomerOrders(
  email: string
): Promise<{ orders: CustomerOrderItem[]; error?: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, total, payment_status,
      fulfillment_status, payment_method, created_at,
      order_items ( qty, photo_url )
    `)
    .eq('customer_email', email)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return { orders: [], error: error?.message };

  return {
    orders: data.map((o) => {
      const items = (o.order_items ?? []) as Array<{ qty: number; photo_url: string | null }>;
      const totalQty = items.reduce((s, i) => s + (i.qty ?? 1), 0);
      const firstPhoto = items.find((i) => i.photo_url)?.photo_url ?? null;
      return {
        id:                o.id,
        orderNumber:       o.order_number,
        total:             o.total,
        paymentStatus:     o.payment_status,
        fulfillmentStatus: o.fulfillment_status,
        paymentMethod:     o.payment_method,
        itemCount:         totalQty,
        firstPhoto,
        createdAt:         o.created_at,
      };
    }),
  };
}

// ── Buscar detalhe completo do pedido para /conta/pedidos/[id] ───

export type OPAttachment = {
  id:       string;
  url:      string;
  filename: string | null;
  mimeType: string | null;
};

export type OPHistoryItem = {
  id:        string;
  type:      string;
  note:      string | null;
  createdAt: string;
};

export type OrderDetailFull = OrderSummary & {
  subtotal:          number;
  discount:          number;
  shipping:          number;
  couponCode:        string | null;
  shippingCarrier:   string | null;
  trackingCode:      string | null;
  shippingAddress:   {
    street: string; number: string | null; complement: string | null;
    district: string | null; city: string; state: string; cep: string;
  } | null;
  progress:    import('./checkout-actions').OrderProgress[];
  opHistory:   OPHistoryItem[];
  attachments: OPAttachment[];
};

export async function getOrderDetail(
  orderId: string
): Promise<{ order: OrderDetailFull | null; error?: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_email,
      total, subtotal, discount, shipping, coupon_code,
      payment_method, fulfillment_status, created_at,
      shipping_carrier, tracking_code,
      order_items ( piece_name, size, qty, unit_price, photo_url ),
      addresses (
        street, number, complement, district, city, state, cep
      )
    `)
    .eq('id', orderId)
    .single();

  if (error || !data) return { order: null, error: error?.message };

  // Busca progresso via RPC
  const { data: progressData } = await supabase.rpc('shop_order_progress', { p_order_id: orderId });
  const progressRows = (progressData ?? []) as Array<{
    op_id: string; op_number: string; op_status: string;
    stage_label: string; stage_key: string; progress_pct: number; updated_at: string;
  }>;

  const opIds = progressRows.map((r) => r.op_id);

  // Busca histórico e anexos das OPs do pedido
  const [historyRes, attachRes] = await Promise.all([
    opIds.length
      ? supabase
          .from('op_history')
          .select('id, op_id, type, note, created_at')
          .in('op_id', opIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as Array<{ id: string; op_id: string; type: string; note: string | null; created_at: string }> | null }),
    opIds.length
      ? supabase
          .from('op_attachments')
          .select('id, url, filename, mime_type')
          .in('op_id', opIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as Array<{ id: string; url: string; filename: string | null; mime_type: string | null }> | null }),
  ]);

  const addrRaw = Array.isArray(data.addresses) ? data.addresses[0] : data.addresses;

  return {
    order: {
      id:                data.id,
      orderNumber:       data.order_number,
      customerName:      data.customer_name,
      customerEmail:     data.customer_email,
      total:             data.total,
      subtotal:          data.subtotal,
      discount:          data.discount,
      shipping:          data.shipping,
      couponCode:        data.coupon_code,
      paymentMethod:     data.payment_method,
      fulfillmentStatus: data.fulfillment_status,
      createdAt:         data.created_at,
      shippingCarrier:   data.shipping_carrier ?? null,
      trackingCode:      data.tracking_code ?? null,
      shippingAddress:   addrRaw
        ? { street: addrRaw.street, number: addrRaw.number, complement: addrRaw.complement,
            district: addrRaw.district, city: addrRaw.city, state: addrRaw.state, cep: addrRaw.cep }
        : null,
      items: (data.order_items as Array<{
        piece_name: string; size: string; qty: number;
        unit_price: number; photo_url: string | null;
      }>).map((i) => ({
        pieceName: i.piece_name,
        size:      i.size,
        qty:       i.qty,
        unitPrice: i.unit_price,
        photoUrl:  i.photo_url,
      })),
      progress: progressRows.map((r) => ({
        opId:        r.op_id,
        opNumber:    r.op_number,
        opStatus:    r.op_status,
        stageLabel:  r.stage_label,
        stageKey:    r.stage_key,
        progressPct: r.progress_pct,
        updatedAt:   r.updated_at,
      })),
      opHistory: ((historyRes.data ?? []) as Array<{
        id: string; type: string; note: string | null; created_at: string
      }>).map((h) => ({
        id:        h.id,
        type:      h.type,
        note:      h.note,
        createdAt: h.created_at,
      })),
      attachments: ((attachRes.data ?? []) as Array<{
        id: string; url: string; filename: string | null; mime_type: string | null
      }>).map((a) => ({
        id:       a.id,
        url:      a.url,
        filename: a.filename,
        mimeType: a.mime_type,
      })),
    },
  };
}

// ── Buscar pedido para página de sucesso ─────────────────────────

export type OrderSummary = {
  id:          string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total:       number;
  paymentMethod: string;
  fulfillmentStatus: string;
  items: Array<{
    pieceName: string;
    size:      string;
    qty:       number;
    unitPrice: number;
    photoUrl:  string | null;
  }>;
  createdAt: string;
};

export async function getOrderSummary(
  orderId: string
): Promise<{ order: OrderSummary | null; error?: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_email,
      total, payment_method, fulfillment_status, created_at,
      order_items(piece_name, size, qty, unit_price, photo_url)
    `)
    .eq('id', orderId)
    .single();

  if (error || !data) return { order: null, error: error?.message };

  return {
    order: {
      id:                data.id,
      orderNumber:       data.order_number,
      customerName:      data.customer_name,
      customerEmail:     data.customer_email,
      total:             data.total,
      paymentMethod:     data.payment_method,
      fulfillmentStatus: data.fulfillment_status,
      createdAt:         data.created_at,
      items: (data.order_items as Array<{
        piece_name: string; size: string; qty: number;
        unit_price: number; photo_url: string | null;
      }>).map((i) => ({
        pieceName: i.piece_name,
        size:      i.size,
        qty:       i.qty,
        unitPrice: i.unit_price,
        photoUrl:  i.photo_url,
      })),
    },
  };
}
