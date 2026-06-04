'use server';

import { redirect } from 'next/navigation';
import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export type CollectionActionState = { error?: string };

export async function createCollection(_prev: CollectionActionState, formData: FormData): Promise<CollectionActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const category = String(formData.get('category') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;

  if (!name) return { error: 'Nome é obrigatório.' };
  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Faça login para criar coleções.' };

  const { error } = await supabase.from('collections').insert({ name, category, description, active: true });
  if (error) return { error: error.message };

  redirect('/colecoes');
}
