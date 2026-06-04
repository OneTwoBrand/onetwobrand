'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export type SeamstressActionState = { error?: string };

const roles = new Set(['Costureira-chefe', 'Costureira', 'Bordadeira', 'Atelier · QA']);

export async function createSeamstress(_prev: SeamstressActionState, formData: FormData): Promise<SeamstressActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const role = String(formData.get('role') ?? 'Costureira').trim();
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const pix = String(formData.get('pix') ?? '').trim() || null;
  const address = String(formData.get('address') ?? '').trim() || null;
  const specialty = String(formData.get('specialty') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (!name) return { error: 'Nome é obrigatório.' };
  if (!roles.has(role)) return { error: 'Selecione uma função válida.' };
  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Faça login para cadastrar costureiras.' };

  const { error } = await supabase.from('seamstresses').insert({
    name,
    role,
    phone,
    pix,
    address,
    specialty,
    notes,
    active: true,
  });

  if (error) return { error: error.message };

  redirect('/costureiras');
}

export async function deleteSeamstress(id: string): Promise<SeamstressActionState> {
  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Faça login para excluir costureiras.' };
  const { error } = await supabase.from('seamstresses').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/costureiras');
  redirect('/costureiras');
}
