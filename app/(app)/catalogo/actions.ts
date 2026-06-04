'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
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

  const slug = name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const { error } = await supabase.from('collections').insert({
    name,
    category,
    description,
    active: true,
    slug,
    published_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  redirect('/catalogo');
}

export async function deleteCollection(id: string): Promise<CollectionActionState> {
  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Faça login para excluir coleções.' };
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/catalogo');
  redirect('/catalogo');
}
