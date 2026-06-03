'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';

export type ShipmentActionState = { error?: string };

export async function createShipment(
  _prev: ShipmentActionState,
  formData: FormData
): Promise<ShipmentActionState> {
  const code = String(formData.get('code') ?? '').trim();
  const seamstress_name = String(formData.get('seamstress_name') ?? '').trim();
  const embroidery_type = String(formData.get('embroidery_type') ?? '').trim() || null;
  const qty = parseInt(String(formData.get('qty') ?? '0'), 10) || 0;
  const sent_at = String(formData.get('sent_at') ?? '').trim();
  const expected_return_at = String(formData.get('expected_return_at') ?? '').trim();

  if (!code) return { error: 'Código é obrigatório.' };
  if (!seamstress_name) return { error: 'Costureira é obrigatória.' };
  if (!qty || qty < 1) return { error: 'Quantidade deve ser ao menos 1.' };
  if (!sent_at) return { error: 'Data de envio é obrigatória.' };
  if (!expected_return_at) return { error: 'Previsão de retorno é obrigatória.' };

  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Faça login para cadastrar bordagens.' };

  const { data: existingSeamstress, error: findError } = await supabase
    .from('seamstresses')
    .select('id')
    .eq('name', seamstress_name)
    .maybeSingle();

  if (findError) return { error: findError.message };

  let seamstressId = existingSeamstress?.id;

  if (!seamstressId) {
    const { data: newSeamstress, error: seamstressError } = await supabase
      .from('seamstresses')
      .insert({ name: seamstress_name, role: 'Bordadeira' })
      .select('id')
      .single();

    if (seamstressError || !newSeamstress) {
      return { error: seamstressError?.message ?? 'Erro ao criar costureira.' };
    }

    seamstressId = newSeamstress.id;
  }

  const { error } = await supabase
    .from('embroidery_shipments')
    .insert({
      code,
      seamstress_id: seamstressId,
      qty,
      sent_at,
      expected_return_at,
      notes: embroidery_type ? `Tipo de bordagem: ${embroidery_type}` : null,
      status: 'Em Bordagem',
    });

  if (error) return { error: error.message };

  redirect('/bordagem');
}
