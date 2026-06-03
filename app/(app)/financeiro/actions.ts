'use server';

import { revalidatePath } from 'next/cache';
import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export type FinanceActionState = { error?: string };

async function getAuthedSupabase() {
  if (!hasSupabasePublicEnv()) throw new Error('Supabase não configurado.');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Faça login para movimentar o financeiro.');
  return supabase;
}

export async function createPayable(_prev: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  try {
    const supplier = String(formData.get('supplier') ?? '').trim();
    const category = String(formData.get('category') ?? '').trim() || null;
    const amount = Number.parseFloat(String(formData.get('amount') ?? '0')) || 0;
    const dueDate = String(formData.get('due_date') ?? '').trim();
    const notes = String(formData.get('notes') ?? '').trim() || null;

    if (!supplier) return { error: 'Informe o fornecedor ou destino.' };
    if (amount <= 0) return { error: 'Informe um valor válido.' };
    if (!dueDate) return { error: 'Informe o vencimento.' };

    const supabase = await getAuthedSupabase();
    const { error } = await supabase.from('payables').insert({
      supplier,
      category,
      amount,
      due_date: dueDate,
      notes,
      status: 'pending',
    });

    if (error) return { error: error.message };

    revalidatePath('/financeiro');
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Erro ao criar conta a pagar.' };
  }
}

export async function createReceivable(_prev: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  try {
    const clientId = String(formData.get('client_id') ?? '').trim();
    const amount = Number.parseFloat(String(formData.get('amount') ?? '0')) || 0;
    const dueDate = String(formData.get('due_date') ?? '').trim();

    if (!clientId) return { error: 'Selecione uma cliente.' };
    if (amount <= 0) return { error: 'Informe um valor válido.' };
    if (!dueDate) return { error: 'Informe o vencimento.' };

    const supabase = await getAuthedSupabase();
    const { error } = await supabase.from('receivables').insert({
      client_id: clientId,
      amount,
      due_date: dueDate,
      status: 'pending',
      reference_type: 'manual',
    });

    if (error) return { error: error.message };

    revalidatePath('/financeiro');
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Erro ao criar conta a receber.' };
  }
}

export async function markPayablePaid(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  if (!id) return;

  const supabase = await getAuthedSupabase();
  await supabase
    .from('payables')
    .update({ status: 'paid', paid_at: new Date().toISOString().slice(0, 10) })
    .eq('id', id);

  revalidatePath('/financeiro');
}

export async function markReceivableReceived(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  if (!id) return;

  const supabase = await getAuthedSupabase();
  await supabase
    .from('receivables')
    .update({ status: 'paid', received_at: new Date().toISOString().slice(0, 10) })
    .eq('id', id);

  revalidatePath('/financeiro');
}
