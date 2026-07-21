export const dynamic = 'force-dynamic';

/**
 * ONE TWO · POST /api/shop/mercadopago
 * Gera PIX (QR Code + copia/cola) ou Boleto via MercadoPago.
 * Body: { orderId, amount, email, method?: 'pix' | 'boleto' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { getCustomerSessionEmail } from '@/lib/shop/customer-session';
import { getOrderForPayment } from '@/lib/shop/orders-admin';

const mp = process.env.MERCADOPAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN })
  : null;

export async function POST(req: NextRequest) {
  if (!mp) {
    return NextResponse.json({ error: 'MercadoPago não configurado.' }, { status: 503 });
  }

  try {
    const customerEmail = await getCustomerSessionEmail();
    if (!customerEmail) return NextResponse.json({ error: 'Sessão do cliente inválida.' }, { status: 401 });
    const body = await req.json().catch(() => null) as { orderId?: string; method?: string; document?: string } | null;
    if (!body?.orderId || !['pix', 'boleto'].includes(body.method ?? '')) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
    }

    const order = await getOrderForPayment(body.orderId, customerEmail);
    if (!order || order.payment_method !== body.method || order.payment_status !== 'pending') {
      return NextResponse.json({ error: 'Pedido indisponível para pagamento.' }, { status: 409 });
    }

    const payment = new Payment(mp);
    const notificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://one2brand.com.br'}/api/shop/mercadopago/webhook`;
    const common = {
      transaction_amount: order.total,
      description: `ONE TWO — Pedido ${order.order_number}`,
      external_reference: order.id,
      notification_url: notificationUrl,
      payer: { email: order.customer_email },
    };

    if (body.method === 'pix') {
      const res = await payment.create({
        body: {
          ...common,
          payment_method_id:  'pix',
        },
        requestOptions: { idempotencyKey: `order-${order.id}-pix` },
      });

      return NextResponse.json({
        paymentId:     res.id,
        status:        res.status,
        qrCodeBase64:  res.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
        pixCopyPaste:  res.point_of_interaction?.transaction_data?.qr_code         ?? null,
      });
    }

    const cpf = String(body.document ?? '').replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
      return NextResponse.json({ error: 'CPF válido é obrigatório para emitir boleto.' }, { status: 400 });
    }
    const [firstName, ...lastNameParts] = order.customer_name.trim().split(/\s+/);
    const res = await payment.create({
      body: {
        ...common,
        payment_method_id:  'bolbradesco',
        payer: {
          email: order.customer_email,
          first_name: firstName,
          last_name: lastNameParts.join(' ') || firstName,
          identification: { type: 'CPF', number: cpf },
        },
      },
      requestOptions: { idempotencyKey: `order-${order.id}-boleto` },
    });

    return NextResponse.json({
      paymentId:  res.id,
      boletoUrl:  (res as unknown as { transaction_details?: { external_resource_url?: string } }).transaction_details?.external_resource_url ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro no MercadoPago.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
