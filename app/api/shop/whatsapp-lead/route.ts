import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const produtoSlug = String(body.produtoSlug ?? '').trim();
    const produtoNome = String(body.produtoNome ?? '').trim();
    const tamanho     = String(body.tamanho     ?? '').trim() || null;
    const url         = String(body.url         ?? '').trim() || null;

    if (!produtoSlug || !produtoNome) {
      return NextResponse.json({ error: 'produtoSlug e produtoNome são obrigatórios.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('whatsapp_leads')
      .insert({ produto_slug: produtoSlug, produto_nome: produtoNome, tamanho, url });

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
