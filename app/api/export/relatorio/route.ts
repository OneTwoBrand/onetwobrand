import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';

export const runtime = 'nodejs';

type ExportType = 'vendas' | 'producao' | 'bordagem' | 'estoque-baixo';

function row(values: (string | number | boolean | null | undefined)[]): string {
  return values
    .map((v) => {
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(',');
}

function csv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return [row(headers), ...rows.map(row)].join('\r\n');
}

export async function GET(request: NextRequest) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'atelier'].includes(profile.role)) {
    return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 });
  }

  const tipo = (request.nextUrl.searchParams.get('tipo') ?? 'vendas') as ExportType;
  const now  = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date());

  let content = '';
  let filename = '';

  if (tipo === 'vendas') {
    const { data, error } = await supabase
      .from('v_sales_report_month')
      .select('id, client_name, total, status, pieces_qty, gross_profit, payment_method, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const STATUS: Record<string, string> = { paid: 'Pago', pending: 'Pendente', cancelled: 'Cancelado' };
    const PAYMENT: Record<string, string> = { pix: 'PIX', card: 'Cartão', cash: 'Dinheiro', transfer: 'Transferência', installment: 'Parcelado' };

    content = csv(
      ['Data', 'Cliente', 'Qtd peças', 'Total (R$)', 'Lucro bruto (R$)', 'Pagamento', 'Status'],
      (data ?? []).map((s) => [
        new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(s.created_at)),
        s.client_name,
        s.pieces_qty,
        Number(s.total).toFixed(2).replace('.', ','),
        Number(s.gross_profit).toFixed(2).replace('.', ','),
        PAYMENT[s.payment_method] ?? s.payment_method,
        STATUS[s.status] ?? s.status,
      ])
    );
    filename = `vendas-${now.replace(/\//g, '-')}.csv`;

  } else if (tipo === 'producao') {
    const { data, error } = await supabase
      .from('v_production_report')
      .select('op_number, status, qty, client_name, piece_name, seamstress_name, due_date, overdue');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    content = csv(
      ['OP', 'Status', 'Qtd', 'Cliente', 'Peça', 'Costureira', 'Prazo', 'Atrasada'],
      (data ?? []).map((p) => [
        p.op_number, p.status, p.qty, p.client_name, p.piece_name,
        p.seamstress_name, p.due_date ?? '', p.overdue ? 'Sim' : 'Não',
      ])
    );
    filename = `producao-${now.replace(/\//g, '-')}.csv`;

  } else if (tipo === 'bordagem') {
    const { data, error } = await supabase
      .from('v_embroidery_report')
      .select('code, status, qty, value, seamstress_name, overdue, expected_return_at');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    content = csv(
      ['Código', 'Status', 'Qtd', 'Valor (R$)', 'Costureira', 'Retorno previsto', 'Atrasada'],
      (data ?? []).map((e) => [
        e.code, e.status, e.qty,
        Number(e.value).toFixed(2).replace('.', ','),
        e.seamstress_name, e.expected_return_at ?? '', e.overdue ? 'Sim' : 'Não',
      ])
    );
    filename = `bordagem-${now.replace(/\//g, '-')}.csv`;

  } else if (tipo === 'estoque-baixo') {
    const { data, error } = await supabase
      .from('v_stock_low')
      .select('name, collection_name, size, quantity, low_threshold');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    content = csv(
      ['Produto', 'Coleção', 'Tamanho', 'Qtd atual', 'Mínimo'],
      (data ?? []).map((s) => [s.name, s.collection_name ?? '', s.size, s.quantity, s.low_threshold])
    );
    filename = `estoque-baixo-${now.replace(/\//g, '-')}.csv`;

  } else {
    return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 });
  }

  // BOM UTF-8 para Excel abrir acentos corretamente
  const bom = '﻿';
  return new NextResponse(bom + content, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
