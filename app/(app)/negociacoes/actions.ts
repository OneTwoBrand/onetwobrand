'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type Lead = {
  id: string;
  produto_slug: string;
  produto_nome: string;
  tamanho: string | null;
  url: string | null;
  status: 'novo' | 'em_atendimento' | 'fechado' | 'perdido';
  notas: string | null;
  atendido_por: string | null;
  created_at: string;
  updated_at: string;
};

async function requireStaff() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Não autenticado.');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!['admin', 'vendedora', 'atelier'].includes(profile?.role ?? '')) {
    throw new Error('Acesso restrito.');
  }
  return { supabase, userId: user.id };
}

export async function getLeads(): Promise<{ leads: Lead[]; error?: string }> {
  try {
    const { supabase } = await requireStaff();
    const { data, error } = await supabase
      .from('whatsapp_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return { leads: [], error: error.message };
    return { leads: (data ?? []) as Lead[] };
  } catch (e) {
    return { leads: [], error: e instanceof Error ? e.message : 'Erro.' };
  }
}

export async function updateLeadStatus(
  id: string,
  status: Lead['status'],
  notas?: string
): Promise<void> {
  const { supabase, userId } = await requireStaff();
  const patch: Record<string, unknown> = { status, atendido_por: userId };
  if (notas !== undefined) patch.notas = notas;
  const { error } = await supabase
    .from('whatsapp_leads')
    .update(patch)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/negociacoes');
}
