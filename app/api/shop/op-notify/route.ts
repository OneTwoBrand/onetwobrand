export const dynamic = 'force-dynamic';

/**
 * ONE TWO · GET|POST /api/shop/op-notify
 * Consome a shop_email_queue e envia e-mails de status ao cliente.
 * Chamada por: Vercel Cron (GET) ou webhook interno (POST).
 * Segurança: Authorization Bearer CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderStatusEmail } from '@/lib/shop/email';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerAuth  = req.headers.get('authorization') ?? '';
  return headerAuth === `Bearer ${secret}`;
}

async function handle(req: NextRequest): Promise<NextResponse> {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado.' }, { status: 503 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Busca até 20 e-mails pendentes
  const { data: queue, error } = await supabase
    .from('shop_email_queue')
    .select(`
      id,
      stage_key,
      progress_pct,
      order_id,
      orders ( order_number, customer_name, customer_email )
    `)
    .is('sent_at', null)
    .is('error', null)
    .is('processing_at', null)
    .order('queued_at', { ascending: true })
    .limit(20);

  if (error || !queue) {
    return NextResponse.json({ error: error?.message ?? 'Erro na fila.' }, { status: 500 });
  }

  const stageLabels: Record<string, string> = {
    confirmed:   'Pedido confirmado',
    production:  'Em produção',
    finishing:   'Acabamento final',
    shipped:     'A caminho',
    delivered:   'Entregue',
    cancelled:   'Cancelado',
  };

  let sent = 0;
  let failed = 0;

  for (const entry of queue) {
    const { data: claimed } = await supabase
      .from('shop_email_queue')
      .update({ processing_at: new Date().toISOString() })
      .eq('id', entry.id)
      .is('sent_at', null)
      .is('error', null)
      .is('processing_at', null)
      .select('id')
      .maybeSingle();
    if (!claimed) continue;

    const order = Array.isArray(entry.orders) ? entry.orders[0] : entry.orders;
    if (!order?.customer_email) {
      await supabase
        .from('shop_email_queue')
        .update({ error: 'E-mail do cliente não encontrado.', processing_at: null })
        .eq('id', entry.id);
      failed++;
      continue;
    }

    try {
      await sendOrderStatusEmail({
        to:           order.customer_email,
        customerName: order.customer_name,
        orderNumber:  order.order_number,
        stage:        stageLabels[entry.stage_key] ?? entry.stage_key,
        progressPct:  entry.progress_pct,
      });

      await supabase
        .from('shop_email_queue')
        .update({ sent_at: new Date().toISOString(), processing_at: null })
        .eq('id', entry.id);

      sent++;
    } catch (e) {
      await supabase
        .from('shop_email_queue')
        .update({ error: e instanceof Error ? e.message : 'Erro desconhecido.', processing_at: null })
        .eq('id', entry.id);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: queue.length });
}

export async function GET(req: NextRequest)  { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
