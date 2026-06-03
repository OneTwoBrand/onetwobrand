'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function markSalePaid(saleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado.');

  const { error } = await supabase
    .from('sales')
    .update({ status: 'paid' })
    .eq('id', saleId);

  if (error) throw new Error(error.message);

  revalidatePath(`/vendas/${saleId}`);
  revalidatePath('/vendas');
  revalidatePath('/');
}

export async function cancelSale(saleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado.');

  const { error } = await supabase
    .from('sales')
    .update({ status: 'cancelled' })
    .eq('id', saleId);

  if (error) throw new Error(error.message);

  revalidatePath(`/vendas/${saleId}`);
  revalidatePath('/vendas');
  revalidatePath('/');
}
