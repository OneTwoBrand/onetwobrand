'use server';

import { redirect } from 'next/navigation';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';

export type ClientActionState = { error?: string };

export async function deleteClient(id: string): Promise<ClientActionState> {
  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Faça login para excluir clientes.' };
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) return { error: error.message };
  redirect('/clientes');
}

export async function saveClient(
  _prev: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const email = String(formData.get('email') ?? '').trim() || null;
  const city = String(formData.get('city') ?? '').trim() || null;
  const state = String(formData.get('state') ?? '').trim() || null;

  if (!name) return { error: 'Nome é obrigatório.' };

  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from('clients')
    .insert({ name, phone, email, city, state });

  if (error) return { error: error.message };

  redirect('/clientes');
}
