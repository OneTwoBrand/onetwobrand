'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';

export type ProductActionState = { error?: string };

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const color = String(formData.get('color') ?? '').trim() || null;
  const sale_price = parseFloat(String(formData.get('sale_price') ?? '0')) || 0;
  const quantity = parseInt(String(formData.get('quantity') ?? '0'), 10) || 0;
  const photo_url = String(formData.get('photo_url') ?? '').trim() || null;
  const size = String(formData.get('size') ?? '').trim() || 'Único';

  if (!name) return { error: 'Nome é obrigatório.' };
  if (quantity < 0) return { error: 'Quantidade não pode ser negativa.' };

  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Faça login para cadastrar produtos.' };

  const { data: piece, error: pieceError } = await supabase
    .from('pieces')
    .insert({
      name,
      color,
      fabric: color,
      sizes: [size],
      price: sale_price,
      photo_url,
    })
    .select('id')
    .single();

  if (pieceError || !piece) return { error: pieceError?.message ?? 'Erro ao criar produto.' };

  const { error: stockError } = await supabase
    .from('stock_items')
    .insert({
      piece_id: piece.id,
      size,
      color,
      quantity,
    });

  if (stockError) return { error: stockError.message };

  redirect('/estoque');
}
