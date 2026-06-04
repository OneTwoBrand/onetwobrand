'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';
import { getNextEmbroideryShipmentCode } from '@/lib/app-data';
import { getWorkflowConfig } from '@/lib/workflow-config';

export type ShipmentActionState = { error?: string };

export async function createShipment(
  _prev: ShipmentActionState,
  formData: FormData
): Promise<ShipmentActionState> {
  const seamstress_id = String(formData.get('seamstress_id') ?? '').trim();
  const embroidery_type = String(formData.get('embroidery_type') ?? '').trim() || null;
  const qty = parseInt(String(formData.get('qty') ?? '0'), 10) || 0;
  const sent_at = String(formData.get('sent_at') ?? '').trim();
  const expected_return_at = String(formData.get('expected_return_at') ?? '').trim();
  const value = Number.parseFloat(String(formData.get('value') ?? '0')) || 0;
  const op_id = String(formData.get('op_id') ?? '').trim() || null;

  if (!seamstress_id) return { error: 'Selecione uma costureira cadastrada.' };
  if (!qty || qty < 1) return { error: 'Quantidade deve ser ao menos 1.' };
  if (!sent_at) return { error: 'Data de envio é obrigatória.' };
  if (!expected_return_at) return { error: 'Previsão de retorno é obrigatória.' };

  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Faça login para cadastrar bordagens.' };

  const { data: seamstress, error: seamstressError } = await supabase
    .from('seamstresses')
    .select('id, active')
    .eq('id', seamstress_id)
    .maybeSingle();

  if (seamstressError) return { error: seamstressError.message };
  if (!seamstress?.id || !seamstress.active) {
    return { error: 'Selecione uma costureira ativa cadastrada.' };
  }

  if (embroidery_type) {
    const config = await getWorkflowConfig();
    if (!config.embroidery_types.includes(embroidery_type)) {
      return { error: 'Selecione um tipo de bordagem válido.' };
    }
  }

  const code = await getNextEmbroideryShipmentCode();
  const { data: shipment, error } = await supabase
    .from('embroidery_shipments')
    .insert({
      code,
      seamstress_id,
      qty,
      sent_at,
      expected_return_at,
      embroidery_type,
      value,
      notes: embroidery_type ? `Tipo de bordagem: ${embroidery_type}` : null,
      status: 'Em Bordagem',
    })
    .select('id')
    .single();

  if (error || !shipment) return { error: error?.message ?? 'Erro ao criar remessa.' };

  if (op_id) {
    const { error: linkError } = await supabase
      .from('shipment_items')
      .insert({ shipment_id: shipment.id, op_id });

    if (linkError) return { error: linkError.message };
  }

  redirect('/bordagem');
}

export async function deleteShipment(id: string): Promise<ShipmentActionState> {
  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Faça login para excluir remessas.' };
  const { error } = await supabase.from('embroidery_shipments').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/bordagem');
  redirect('/bordagem');
}

export async function finishShipment(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  if (!id || !hasSupabasePublicEnv()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from('embroidery_shipments')
    .update({ status: 'Finalizada', returned_at: new Date().toISOString().slice(0, 10) })
    .eq('id', id);

  revalidatePath('/bordagem');
  revalidatePath('/financeiro');
}
