import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type SacolaItem = {
  nome: string;
  tamanho: string | null;
  qty: number;
  preco: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tipo = body.tipo === 'sacola' ? 'sacola' : 'produto';

    const supabase = await createClient();

    if (tipo === 'sacola') {
      // Negociação de sacola completa (checkout)
      const itensRaw = Array.isArray(body.itens) ? body.itens : [];
      const itens: SacolaItem[] = itensRaw.map((it: Record<string, unknown>) => ({
        nome:    String(it.nome ?? '').trim(),
        tamanho: it.tamanho ? String(it.tamanho).trim() : null,
        qty:     Number(it.qty ?? 1),
        preco:   Number(it.preco ?? 0),
      }));

      if (itens.length === 0) {
        return NextResponse.json({ error: 'A sacola está vazia.' }, { status: 400 });
      }

      const clienteNome     = String(body.clienteNome     ?? '').trim() || null;
      const clienteEmail    = String(body.clienteEmail    ?? '').trim() || null;
      const clienteTelefone = String(body.clienteTelefone ?? '').trim() || null;
      const total           = Number(body.total ?? 0);
      const url             = String(body.url ?? '').trim() || null;

      const { error } = await supabase
        .from('whatsapp_leads')
        .insert({
          tipo:             'sacola',
          cliente_nome:     clienteNome,
          cliente_email:    clienteEmail,
          cliente_telefone: clienteTelefone,
          itens,
          total,
          url,
        });

      if (error) {
        console.error('[whatsapp-lead:sacola]', error.message);
        // Aqui o registro é pré-requisito da confirmação — propaga o erro.
        return NextResponse.json({ error: 'Não foi possível registrar a negociação.' }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    // Lead por produto (comportamento original — falha silenciosa)
    const produtoSlug = String(body.produtoSlug ?? '').trim();
    const produtoNome = String(body.produtoNome ?? '').trim();
    const tamanho     = String(body.tamanho     ?? '').trim() || null;
    const url         = String(body.url         ?? '').trim() || null;

    if (!produtoSlug || !produtoNome) {
      return NextResponse.json({ error: 'produtoSlug e produtoNome são obrigatórios.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('whatsapp_leads')
      .insert({ tipo: 'produto', produto_slug: produtoSlug, produto_nome: produtoNome, tamanho, url });

    if (error) {
      console.error('[whatsapp-lead]', error.message);
      // Não bloqueia a navegação da cliente — falha silenciosa
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
