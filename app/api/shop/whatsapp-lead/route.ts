import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const itemSchema = z.object({
  nome: z.string().trim().min(1).max(160),
  tamanho: z.string().trim().max(20).nullable().optional(),
  qty: z.coerce.number().int().min(1).max(20),
  preco: z.coerce.number().min(0).max(1_000_000),
}).strict();

const bagSchema = z.object({
  tipo: z.literal('sacola'),
  clienteNome: z.string().trim().max(120).optional(),
  clienteEmail: z.string().trim().email().max(254).or(z.literal('')).optional(),
  clienteTelefone: z.string().trim().max(30).optional(),
  itens: z.array(itemSchema).min(1).max(30),
  url: z.string().url().max(1000).optional(),
}).passthrough();

const productSchema = z.object({
  tipo: z.string().optional(),
  produtoSlug: z.string().trim().min(1).max(180),
  produtoNome: z.string().trim().min(1).max(180),
  tamanho: z.string().trim().max(20).optional(),
  url: z.string().url().max(1000).optional(),
}).passthrough();

function requestKey(request: Request): string | null {
  const secret = process.env.ENCRYPTION_SECRET ?? process.env.SHOP_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
  return createHash('sha256').update(`${secret}:${ip}`).digest('hex');
}

export async function POST(request: Request) {
  const keyHash = requestKey(request);
  if (!keyHash) {
    return NextResponse.json({ error: 'Proteção do endpoint não configurada.' }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: allowed, error: limitError } = await admin.rpc('check_api_rate_limit', {
    p_key_hash: keyHash,
    p_limit: 10,
    p_window_seconds: 600,
  });
  if (limitError) return NextResponse.json({ error: 'Serviço temporariamente indisponível.' }, { status: 503 });
  if (!allowed) return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  if (typeof body === 'object' && body !== null && 'tipo' in body && body.tipo === 'sacola') {
    const parsed = bagSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Dados da sacola inválidos.' }, { status: 400 });
    const input = parsed.data;
    const total = input.itens.reduce((sum, item) => sum + item.preco * item.qty, 0);
    const { error } = await admin.from('whatsapp_leads').insert({
      tipo: 'sacola',
      cliente_nome: input.clienteNome || null,
      cliente_email: input.clienteEmail || null,
      cliente_telefone: input.clienteTelefone || null,
      itens: input.itens,
      total,
      url: input.url ?? null,
    });
    if (error) {
      console.error('[whatsapp-lead:sacola]', error.message);
      return NextResponse.json({ error: 'Não foi possível registrar a negociação.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados do produto inválidos.' }, { status: 400 });
  const input = parsed.data;
  const { error } = await admin.from('whatsapp_leads').insert({
    tipo: 'produto',
    produto_slug: input.produtoSlug,
    produto_nome: input.produtoNome,
    tamanho: input.tamanho || null,
    url: input.url ?? null,
  });
  if (error) {
    console.error('[whatsapp-lead:produto]', error.message);
    return NextResponse.json({ error: 'Não foi possível registrar a negociação.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
