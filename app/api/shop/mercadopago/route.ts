/**
 * ONE TWO · POST /api/shop/mercadopago
 * Gera PIX (QR Code + copia/cola) ou Boleto via MercadoPago.
 * Body: { orderId, amount, email, method?: 'pix' | 'boleto' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const mp = process.env.MERCADOPAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN })
  : null;

export async function POST(req: NextRequest) {
  if (!mp) {
    return NextResponse.json({ error: 'MercadoPago não configurado.' }, { status: 503 });
  }

  const { orderId, amount, email, method = 'pix' } = await req.json();
  if (!orderId || !amount || !email) {
    return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
  }

  const payment = new Payment(mp);

  try {
    if (method === 'pix') {
      const res = await payment.create({
        body: {
          transaction_amount: Number(amount),
          description:        'ONE TWO — Pedido ' + orderId,
          payment_method_id:  'pix',
          payer:              { email },
        },
      });

      return NextResponse.json({
        paymentId:     res.id,
        status:        res.status,
        qrCodeBase64:  res.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
        pixCopyPaste:  res.point_of_interaction?.transaction_data?.qr_code         ?? null,
      });
    }

    // Boleto
    const res = await payment.create({
      body: {
        transaction_amount: Number(amount),
        description:        'ONE TWO — Pedido ' + orderId,
        payment_method_id:  'bolbradesco',
        payer: {
          email,
          first_name: email.split('@')[0],
          last_name:  'Cliente',
          identification: { type: 'CPF', number: '00000000000' },
          address: { zip_code: '01310100', street_name: 'Av. Paulista', street_number: '1578', neighborhood: 'Bela Vista', city: 'São Paulo', federal_unit: 'SP' },
        },
      },
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
