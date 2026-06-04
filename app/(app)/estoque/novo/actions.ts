'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';

export type ProductActionState = { error?: string };

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function formBoolean(value: FormDataEntryValue | null) {
  return value === 'on' || value === 'true' || value === '1';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

async function revalidateShopPaths(supabase: SupabaseClient, slug?: string | null, collectionId?: string | null) {
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

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const collection_id = String(formData.get('collection_id') ?? '').trim() || null;
  const category = String(formData.get('category') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const color = String(formData.get('color') ?? '').trim() || null;
  const fabric = String(formData.get('fabric') ?? '').trim() || color;
  const cost_price = parseFloat(String(formData.get('cost_price') ?? '0')) || 0;
  const sale_price = parseFloat(String(formData.get('sale_price') ?? '0')) || 0;
  const quantity = parseInt(String(formData.get('quantity') ?? '0'), 10) || 0;
  const low_threshold = parseInt(String(formData.get('low_threshold') ?? '3'), 10) || 3;
  const photo_url = String(formData.get('photo_url') ?? '').trim() || null;
  const back_photo_url = String(formData.get('back_photo_url') ?? '').trim() || null;
  const detail_photo_url = String(formData.get('detail_photo_url') ?? '').trim() || null;
  const size = String(formData.get('size') ?? '').trim() || 'Único';
  const published = formBoolean(formData.get('published'));
  const featured = formBoolean(formData.get('featured'));

  if (!name) return { error: 'Nome é obrigatório.' };
  if (quantity < 0) return { error: 'Quantidade não pode ser negativa.' };

  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Faça login para cadastrar produtos.' };

  let slug: string | null = null;
  if (published) {
    try {
      slug = await uniquePieceSlug(supabase, name);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Erro ao gerar slug do produto.' };
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
      sizes: [size],
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

  const { error: stockError } = await supabase
    .from('stock_items')
    .insert({
      piece_id: piece.id,
      size,
      color,
      quantity,
      low_threshold,
    });

  if (stockError) return { error: stockError.message };

  await revalidateShopPaths(supabase, piece.slug, collection_id);
  redirect('/estoque');
}

export async function updateProduct(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const stockItemId = String(formData.get('stock_item_id') ?? '').trim();
  const pieceId = String(formData.get('piece_id') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const collection_id = String(formData.get('collection_id') ?? '').trim() || null;
  const category = String(formData.get('category') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const color = String(formData.get('color') ?? '').trim() || null;
  const fabric = String(formData.get('fabric') ?? '').trim() || color;
  const cost_price = parseFloat(String(formData.get('cost_price') ?? '0')) || 0;
  const sale_price = parseFloat(String(formData.get('sale_price') ?? '0')) || 0;
  const quantity = parseInt(String(formData.get('quantity') ?? '0'), 10) || 0;
  const low_threshold = parseInt(String(formData.get('low_threshold') ?? '3'), 10) || 3;
  const photo_url = String(formData.get('photo_url') ?? '').trim() || null;
  const back_photo_url = String(formData.get('back_photo_url') ?? '').trim() || null;
  const detail_photo_url = String(formData.get('detail_photo_url') ?? '').trim() || null;
  const size = String(formData.get('size') ?? '').trim() || 'Único';
  const published = formBoolean(formData.get('published'));
  const featured = formBoolean(formData.get('featured'));

  if (!stockItemId || !pieceId) return { error: 'Produto inválido para edição.' };
  if (!name) return { error: 'Nome é obrigatório.' };
  if (quantity < 0) return { error: 'Quantidade não pode ser negativa.' };

  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Faça login para editar produtos.' };

  const { data: currentStock, error: stockReadError } = await supabase
    .from('stock_items')
    .select('id, piece_id, size, color, quantity')
    .eq('id', stockItemId)
    .eq('piece_id', pieceId)
    .maybeSingle();

  if (stockReadError || !currentStock) return { error: stockReadError?.message ?? 'SKU não encontrado.' };

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
      return { error: error instanceof Error ? error.message : 'Erro ao gerar slug do produto.' };
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
      sizes: [size],
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

  const previousQty = Number(currentStock.quantity ?? 0);
  const { error: stockError } = await supabase
    .from('stock_items')
    .update({
      size,
      color,
      quantity,
      low_threshold,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stockItemId);

  if (stockError) return { error: stockError.message };

  if (quantity !== previousQty) {
    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        stock_item_id: stockItemId,
        piece_id: pieceId,
        size,
        color,
        type: 'ajuste',
        qty: Math.abs(quantity - previousQty),
        previous_qty: previousQty,
        resulting_qty: quantity,
        reference_type: 'manual',
        notes: 'Ajuste via edição do produto',
        created_by: user.id,
      });

    if (movementError) return { error: movementError.message };
  }

  await revalidateShopPaths(supabase, slug, collection_id);
  if (currentPiece.collection_id && currentPiece.collection_id !== collection_id) {
    await revalidateShopPaths(supabase, slug, currentPiece.collection_id);
  }

  redirect('/estoque');
}

export async function deleteStockItem(stockItemId: string, pieceId: string): Promise<ProductActionState> {
  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Faça login para excluir produtos.' };

  const { error: stockError } = await supabase.from('stock_items').delete().eq('id', stockItemId);
  if (stockError) return { error: stockError.message };

  // Remove a peça-mãe se não houver outros SKUs vinculados
  const { count } = await supabase
    .from('stock_items')
    .select('id', { count: 'exact', head: true })
    .eq('piece_id', pieceId);

  if (count === 0) {
    await supabase.from('pieces').delete().eq('id', pieceId);
  }

  revalidatePath('/estoque');
  revalidatePath('/loja');
  revalidatePath('/sitemap.xml');
  redirect('/estoque');
}
