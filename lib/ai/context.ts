import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';

// Builds a compact operational context string to inject into the system prompt
export async function buildOperationalContext(): Promise<string> {
  if (!hasSupabasePublicEnv()) return 'Banco de dados não configurado.';
  try {
    const supabase = await createClient();

    const [{ data: kpis }, { data: ops }, { data: stock }, { data: finance }] = await Promise.all([
      supabase.from('v_dashboard_kpis').select('*').maybeSingle(),
      supabase.from('production_orders').select('op_number, status, due_date, clients(name), pieces(name)').in('status', ['Aberta', 'Aguardando Material', 'Em Produção', 'Em Bordagem', 'Em Revisão']).order('due_date', { ascending: true }).limit(10),
      supabase.from('v_stock_low').select('name, size, quantity, low_threshold').limit(10),
      supabase.from('v_financial_summary').select('revenue_month, to_receive, to_pay, gross_profit_month').maybeSingle(),
    ]);

    const lines: string[] = [
      '=== DADOS OPERACIONAIS ATUAIS DA ONE TWO ===',
      '',
      '--- KPIs ---',
      `Produções ativas: ${kpis?.in_production ?? 0}`,
      `Peças em bordagem: ${kpis?.in_embroidery ?? 0}`,
      `Total em estoque: ${kpis?.stock_total ?? 0} peças`,
      `OPs atrasadas: ${kpis?.overdue_ops ?? 0}`,
      `SKUs com estoque baixo: ${kpis?.low_stock_skus ?? 0}`,
      '',
      '--- ORDENS DE PRODUÇÃO ATIVAS ---',
    ];

    if (ops?.length) {
      for (const op of ops) {
        const client = Array.isArray(op.clients) ? op.clients[0] : op.clients;
        const piece = Array.isArray(op.pieces) ? op.pieces[0] : op.pieces;
        lines.push(`  OP #${op.op_number} | ${(piece as { name: string } | null)?.name ?? '?'} | Cliente: ${(client as { name: string } | null)?.name ?? '?'} | Status: ${op.status} | Prazo: ${op.due_date}`);
      }
    } else {
      lines.push('  Nenhuma OP ativa.');
    }

    lines.push('', '--- ESTOQUE CRÍTICO ---');
    if (stock?.length) {
      for (const s of stock) {
        lines.push(`  ${s.name} (${s.size}): ${s.quantity} un. (mín. ${s.low_threshold})`);
      }
    } else {
      lines.push('  Nenhum SKU com estoque crítico.');
    }

    lines.push('', '--- FINANCEIRO DO MÊS ---');
    if (finance) {
      lines.push(`  Faturamento: R$ ${Number(finance.revenue_month).toFixed(2)}`);
      lines.push(`  Lucro bruto: R$ ${Number(finance.gross_profit_month).toFixed(2)}`);
      lines.push(`  A receber: R$ ${Number(finance.to_receive).toFixed(2)}`);
      lines.push(`  A pagar: R$ ${Number(finance.to_pay).toFixed(2)}`);
    }

    lines.push('', '=== FIM DOS DADOS ===');
    return lines.join('\n');
  } catch {
    return 'Erro ao carregar dados operacionais.';
  }
}
