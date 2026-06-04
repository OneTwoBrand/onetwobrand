/**
 * ONE TWO · POST /api/shop/op-notify
 * Consome a shop_email_queue e envia e-mails de status ao cliente.
 * Chamada por: cron job ou webhook interno.
 * Segurança: verifica header Authorization Bearer CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderStatusEmail } from '@/lib/shop/email';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
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
    const order = Array.isArray(entry.orders) ? entry.orders[0] : entry.orders;
    if (!order?.customer_email) {
      await supabase
        .from('shop_email_queue')
        .update({ error: 'E-mail do cliente não encontrado.' })
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
        .update({ sent_at: new Date().toISOString() })
        .eq('id', entry.id);

      sent++;
    } catch (e) {
      await supabase
        .from('shop_email_queue')
        .update({ error: e instanceof Error ? e.message : 'Erro desconhecido.' })
        .eq('id', entry.id);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: queue.length });
}
