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
  const collection = String(formData.get('collection') ?? '').trim() || null;
  const category = String(formData.get('category') ?? '').trim() || null;
  const color = String(formData.get('color') ?? '').trim() || null;
  const cost_price = parseFloat(String(formData.get('cost_price') ?? '0')) || 0;
  const sale_price = parseFloat(String(formData.get('sale_price') ?? '0')) || 0;
  const quantity = parseInt(String(formData.get('quantity') ?? '0'), 10) || 0;

  if (!name) return { error: 'Nome é obrigatório.' };

  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('products')
    .insert({ name, collection, category, color, cost_price, sale_price, quantity });

  if (error) return { error: error.message };

  redirect('/estoque');
}
