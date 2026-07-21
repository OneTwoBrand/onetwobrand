/**
 * ONE TWO · Checkout server actions
 * Cria o pedido, valida cupom, atualiza payment_status.
 * Usa createAdminClient() para contornar RLS em operações de sistema.
 */
'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { buildShippingOptions, DEFAULT_FREE_THRESHOLD, type ShippingOption } from './shipping';
import { getPlatformConfig } from '@/lib/platform-config';
import { parseMoneyBR } from '@/lib/input-masks';
import type { CartItem } from './cart-store';
import { z } from 'zod';
import {
  assertCustomerSessionConfigured,
  getCustomerSessionEmail,
  setCustomerSession,
} from './customer-session';
import { getInternalOrderSummary } from './orders-admin';

async function getFreeShippingThreshold(): Promise<number> {
  try {
    const raw = await getPlatformConfig('shop_free_shipping_above');
    if (!raw) return DEFAULT_FREE_THRESHOLD;
    const parsed = parseMoneyBR(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_FREE_THRESHOLD;
  } catch {
    return DEFAULT_FREE_THRESHOLD;
  }
}

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
  shippingId:    string;
  paymentMethod: 'card' | 'pix' | 'boleto';
  couponCode:    string | null;
  items:         CartItem[];
};

export type CreateOrderResult =
  | { ok: true;  orderId: string; orderNumber: string; total: number }
  | { ok: false; error: string };

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().toLowerCase().email().max(254),
  customerPhone: z.string().trim().max(30),
  address: z.object({
    label: z.string().trim().min(1).max(40),
    street: z.string().trim().min(2).max(160),
    number: z.string().trim().min(1).max(30),
    complement: z.string().trim().max(120),
    district: z.string().trim().max(100),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().length(2).transform((value) => value.toUpperCase()),
    cep: z.string().transform((value) => value.replace(/\D/g, '')).pipe(z.string().length(8)),
  }),
  shippingId: z.enum(['sedex', 'pac', 'retirada']),
  paymentMethod: z.enum(['card', 'pix', 'boleto']),
  couponCode: z.string().trim().max(40).nullable(),
  items: z.array(z.object({
    pieceId: z.string().uuid(),
    size: z.string().trim().min(1).max(20),
    qty: z.number().int().min(1).max(20),
  }).passthrough()).min(1).max(30),
}).strict();

// ── Criar pedido ─────────────────────────────────────────────────

export async function createOrder(payload: CheckoutPayload): Promise<CreateOrderResult> {
  try {
    assertCustomerSessionConfigured();
    const parsed = checkoutSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, error: 'Dados do checkout inválidos.' };

    const input = parsed.data;
    const supabase = createAdminClient();
    const pieceIds = [...new Set(input.items.map((item) => item.pieceId))];
    const [{ data: pieces, error: piecesError }, { data: stock, error: stockError }] = await Promise.all([
      supabase.from('pieces').select('id, name, price, photo_url, color').in('id', pieceIds).eq('active', true),
      supabase.from('stock_items').select('piece_id, size, quantity').in('piece_id', pieceIds),
    ]);

    if (piecesError || stockError || !pieces || pieces.length !== pieceIds.length) {
      return { ok: false, error: 'Não foi possível validar os produtos do pedido.' };
    }

    const pieceById = new Map(pieces.map((piece) => [piece.id, piece]));
    const validatedItems = [];
    for (const item of input.items) {
      const piece = pieceById.get(item.pieceId);
      const available = (stock ?? [])
        .filter((row) => row.piece_id === item.pieceId && row.size === item.size)
        .reduce((sum, row) => sum + Number(row.quantity), 0);
      if (!piece || available < item.qty) {
        return { ok: false, error: `Estoque indisponível para um dos itens (${item.size}).` };
      }
      validatedItems.push({
        ...item,
        name: piece.name,
        price: Number(piece.price),
        color: piece.color ?? null,
        photoUrl: piece.photo_url ?? null,
      });
    }

    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    let couponDiscount = 0;
    let couponCode: string | null = null;
    if (input.couponCode) {
      const coupon = await validateCoupon(input.couponCode, subtotal);
      if (!coupon.ok) return coupon;
      couponDiscount = coupon.discount;
      couponCode = coupon.code;
    }

    const paymentDiscount = input.paymentMethod === 'pix'
      ? Math.round((subtotal - couponDiscount) * 0.05 * 100) / 100
      : 0;
    const totalDiscount = couponDiscount + paymentDiscount;
    const shippingOptions = buildShippingOptions(subtotal, await getFreeShippingThreshold());
    const shipping = shippingOptions.find((option) => option.id === input.shippingId);
    if (!shipping) return { ok: false, error: 'Modalidade de frete inválida.' };
    const total = Math.max(0, subtotal - totalDiscount + shipping.price);

    // 1. Upsert customer
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .upsert(
        { name: input.customerName, email: input.customerEmail, phone: input.customerPhone },
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
        ...input.address,
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
        customer_name:       input.customerName,
        customer_email:      input.customerEmail,
        subtotal,
        discount:            totalDiscount,
        shipping:            shipping.price,
        total,
        coupon_code:         couponCode,
        payment_method:      input.paymentMethod,
        payment_status:      'pending',
        shipping_address_id: address.id,
        shipping_carrier:    shipping.carrier,
      })
      .select('id, order_number, total')
      .single();

    if (orderErr || !order) {
      return { ok: false, error: orderErr?.message ?? 'Erro ao criar pedido.' };
    }

    // 5. Inserir order_items
    const itemsPayload = validatedItems.map((item) => ({
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
      await supabase.from('orders').delete().eq('id', order.id);
      return { ok: false, error: itemsErr.message };
    }

    await setCustomerSession(input.customerEmail);
    return { ok: true, orderId: order.id, orderNumber: order.order_number, total: order.total };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro inesperado.' };
  }
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
  const customerEmail = await getCustomerSessionEmail();
  if (!customerEmail) return { progress: [], error: 'Sessão do cliente inválida.' };
  const supabase = createAdminClient();
  const { data: ownedOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('customer_email', customerEmail)
    .maybeSingle();
  if (!ownedOrder) return { progress: [], error: 'Pedido não encontrado.' };
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

export async function getCustomerOrders(): Promise<{ orders: CustomerOrderItem[]; error?: string }> {
  const email = await getCustomerSessionEmail();
  if (!email) return { orders: [], error: 'Sessão do cliente inválida.' };
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

export type CustomerProfile = { name: string; email: string; phone: string };

export async function getCustomerProfile(): Promise<{ profile: CustomerProfile | null; error?: string }> {
  const email = await getCustomerSessionEmail();
  if (!email) return { profile: null, error: 'Sessão do cliente inválida.' };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('customers')
    .select('name, email, phone')
    .eq('email', email)
    .maybeSingle();
  if (error || !data) return { profile: null, error: error?.message ?? 'Cliente não encontrado.' };
  return { profile: { name: data.name, email: data.email, phone: data.phone ?? '' } };
}

const customerProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30),
});

export async function updateCustomerProfile(input: { name: string; phone: string }): Promise<{ ok: boolean; error?: string }> {
  const email = await getCustomerSessionEmail();
  if (!email) return { ok: false, error: 'Sessão do cliente inválida.' };
  const parsed = customerProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Dados pessoais inválidos.' };
  const admin = createAdminClient();
  const { error } = await admin.from('customers').update(parsed.data).eq('email', email);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export type CustomerAddress = {
  id: string; label: string; street: string; number: string | null;
  complement: string | null; district: string | null; city: string;
  state: string; cep: string; is_default: boolean;
};

async function getSessionCustomerId(): Promise<string | null> {
  const email = await getCustomerSessionEmail();
  if (!email) return null;
  const admin = createAdminClient();
  const { data } = await admin.from('customers').select('id').eq('email', email).maybeSingle();
  return data?.id ?? null;
}

export async function getCustomerAddresses(): Promise<{ addresses: CustomerAddress[]; error?: string }> {
  const customerId = await getSessionCustomerId();
  if (!customerId) return { addresses: [], error: 'Sessão do cliente inválida.' };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('addresses')
    .select('id, label, street, number, complement, district, city, state, cep, is_default')
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  return error
    ? { addresses: [], error: error.message }
    : { addresses: (data ?? []) as CustomerAddress[] };
}

export async function deleteCustomerAddress(addressId: string): Promise<{ ok: boolean; error?: string }> {
  const customerId = await getSessionCustomerId();
  if (!customerId || !z.string().uuid().safeParse(addressId).success) {
    return { ok: false, error: 'Endereço inválido.' };
  }
  const admin = createAdminClient();
  const { error } = await admin.from('addresses').delete().eq('id', addressId).eq('customer_id', customerId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function setDefaultCustomerAddress(addressId: string): Promise<{ ok: boolean; error?: string }> {
  const customerId = await getSessionCustomerId();
  if (!customerId || !z.string().uuid().safeParse(addressId).success) {
    return { ok: false, error: 'Endereço inválido.' };
  }
  const admin = createAdminClient();
  const { data: owned } = await admin
    .from('addresses').select('id').eq('id', addressId).eq('customer_id', customerId).maybeSingle();
  if (!owned) return { ok: false, error: 'Endereço não encontrado.' };
  const { error: clearError } = await admin.from('addresses').update({ is_default: false }).eq('customer_id', customerId);
  if (clearError) return { ok: false, error: clearError.message };
  const { error } = await admin.from('addresses').update({ is_default: true }).eq('id', addressId).eq('customer_id', customerId);
  return error ? { ok: false, error: error.message } : { ok: true };
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
  const customerEmail = await getCustomerSessionEmail();
  if (!customerEmail) return { order: null, error: 'Sessão do cliente inválida.' };
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_email,
      total, subtotal, discount, shipping, coupon_code,
      payment_method, payment_status, fulfillment_status, created_at,
      shipping_carrier, tracking_code,
      order_items ( piece_name, size, qty, unit_price, photo_url ),
      addresses (
        street, number, complement, district, city, state, cep
      )
    `)
    .eq('id', orderId)
    .eq('customer_email', customerEmail)
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
      paymentStatus:     data.payment_status,
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
  paymentStatus: string;
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
  const customerEmail = await getCustomerSessionEmail();
  if (!customerEmail) return { order: null, error: 'Sessão do cliente inválida.' };
  const data = await getInternalOrderSummary(orderId);
  if (!data || data.customerEmail !== customerEmail) {
    return { order: null, error: 'Pedido não encontrado.' };
  }

  return {
    order: {
      id:                data.id,
      orderNumber:       data.orderNumber,
      customerName:      data.customerName,
      customerEmail:     data.customerEmail,
      total:             data.total,
      paymentMethod:     data.paymentMethod,
      paymentStatus:     data.paymentStatus,
      fulfillmentStatus: data.fulfillmentStatus,
      createdAt:         data.createdAt,
      items:             data.items,
    },
  };
}


// ── Shipping config (lido do platform_config) ────────────────────────────────

export async function getShippingConfig(subtotal: number): Promise<{
  options: ShippingOption[];
  freeThreshold: number;
}> {
  const freeThreshold = await getFreeShippingThreshold();
  const options = buildShippingOptions(subtotal, freeThreshold);
  return { options, freeThreshold };
}
