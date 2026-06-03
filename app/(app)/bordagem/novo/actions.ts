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
  const value = parseFloat(String(formData.get('value') ?? '0')) || 0;

  if (!code) return { error: 'Código é obrigatório.' };
  if (!seamstress_name) return { error: 'Costureira é obrigatória.' };
  if (!qty || qty < 1) return { error: 'Quantidade deve ser ao menos 1.' };
  if (!sent_at) return { error: 'Data de envio é obrigatória.' };
  if (!expected_return_at) return { error: 'Previsão de retorno é obrigatória.' };

  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('embroidery_shipments')
    .insert({ code, seamstress_name, embroidery_type, qty, sent_at, expected_return_at, value, status: 'Em Bordagem' });

  if (error) return { error: error.message };

  redirect('/bordagem');
}
