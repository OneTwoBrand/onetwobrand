'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';
import { parseMoneyBR } from '@/lib/input-masks';

export type PieceActionState = { error?: string };

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function formBoolean(value: FormDataEntryValue | null) {
  return value === 'on' || value === 'true' || value === '1';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function uniquePieceSlug(supabase: SupabaseClient, name: string, currentPieceId?: string) {
  const base = slugify(name) || 'produto';

  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    let query = supabase.from('pieces').select('id').eq('slug', candidate).limit(1);
    if (currentPieceId) query = query.neq('id', currentPieceId);

    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return candidate;
  }

  return `${base}-${Date.now()}`;
}

async function revalidatePaths(supabase: SupabaseClient, slug?: string | null, collectionId?: string | null) {
  revalidatePath('/produtos');
  revalidatePath('/estoque');
  revalidatePath('/loja');
  revalidatePath('/loja/colecoes');
  revalidatePath('/sitemap.xml');

  if (slug) revalidatePath(`/produto/${slug}`);

  if (collectionId) {
    const { data } = await supabase
      .from('collections')
      .select('slug')
      .eq('id', collectionId)
      .maybeSingle();

    if (data?.slug) revalidatePath(`/loja/colecoes/${data.slug}`);
  }
}

export async function createPiece(
  _prev: PieceActionState,
  formData: FormData
): Promise<PieceActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const collection_id = String(formData.get('collection_id') ?? '').trim() || null;
  const category = String(formData.get('category') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const color = String(formData.get('color') ?? '').trim() || null;
  const fabric = String(formData.get('fabric') ?? '').trim() || color;
  const cost_price = parseMoneyBR(formData.get('cost_price'));
  const sale_price = parseMoneyBR(formData.get('sale_price'));
  const photo_url = String(formData.get('photo_url') ?? '').trim() || null;
  const back_photo_url = String(formData.get('back_photo_url') ?? '').trim() || null;
  const detail_photo_url = String(formData.get('detail_photo_url') ?? '').trim() || null;
  const published = formBoolean(formData.get('published'));
  const featured = formBoolean(formData.get('featured'));

  if (!name) return { error: 'Nome é obrigatório.' };
  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Faça login para cadastrar produtos.' };

  let slug: string | null = null;
  if (published) {
    try {
      slug = await uniquePieceSlug(supabase, name);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Erro ao gerar slug.' };
    }
  }

  const { data: piece, error: pieceError } = await supabase
    .from('pieces')
    .insert({
      name,
      slug,
      collection_id,
      category,
      description,
      color,
      fabric,
      cost_price,
      price: sale_price,
      photo_url,
      back_photo_url,
      detail_photo_url,
      published,
      featured,
    })
    .select('id, slug')
    .single();

  if (pieceError || !piece) return { error: pieceError?.message ?? 'Erro ao criar produto.' };

  await revalidatePaths(supabase, piece.slug, collection_id);
  redirect('/produtos');
}

export async function updatePiece(
  _prev: PieceActionState,
  formData: FormData
): Promise<PieceActionState> {
  const pieceId = String(formData.get('piece_id') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const collection_id = String(formData.get('collection_id') ?? '').trim() || null;
  const category = String(formData.get('category') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const color = String(formData.get('color') ?? '').trim() || null;
  const fabric = String(formData.get('fabric') ?? '').trim() || color;
  const cost_price = parseMoneyBR(formData.get('cost_price'));
  const sale_price = parseMoneyBR(formData.get('sale_price'));
  const photo_url = String(formData.get('photo_url') ?? '').trim() || null;
  const back_photo_url = String(formData.get('back_photo_url') ?? '').trim() || null;
  const detail_photo_url = String(formData.get('detail_photo_url') ?? '').trim() || null;
  const published = formBoolean(formData.get('published'));
  const featured = formBoolean(formData.get('featured'));

  if (!pieceId) return { error: 'Produto inválido para edição.' };
  if (!name) return { error: 'Nome é obrigatório.' };
  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Faça login para editar produtos.' };

  const { data: currentPiece, error: pieceReadError } = await supabase
    .from('pieces')
    .select('id, slug, collection_id')
    .eq('id', pieceId)
    .maybeSingle();

  if (pieceReadError || !currentPiece) return { error: pieceReadError?.message ?? 'Produto não encontrado.' };

  let slug = currentPiece.slug as string | null;
  if (published && !slug) {
    try {
      slug = await uniquePieceSlug(supabase, name, pieceId);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Erro ao gerar slug.' };
    }
  }

  const { error: pieceError } = await supabase
    .from('pieces')
    .update({
      name,
      slug,
      collection_id,
      category,
      description,
      color,
      fabric,
      cost_price,
      price: sale_price,
      photo_url,
      back_photo_url,
      detail_photo_url,
      published,
      featured,
    })
    .eq('id', pieceId);

  if (pieceError) return { error: pieceError.message };

  await revalidatePaths(supabase, slug, collection_id);
  if (currentPiece.collection_id && currentPiece.collection_id !== collection_id) {
    await revalidatePaths(supabase, slug, currentPiece.collection_id);
  }

  redirect('/produtos');
}

export async function deletePiece(pieceId: string): Promise<PieceActionState> {
  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Faça login para excluir produtos.' };

  const { error } = await supabase.from('pieces').delete().eq('id', pieceId);
  if (error) return { error: error.message };

  revalidatePath('/produtos');
  revalidatePath('/estoque');
  revalidatePath('/loja');
  revalidatePath('/sitemap.xml');
  redirect('/produtos');
}
