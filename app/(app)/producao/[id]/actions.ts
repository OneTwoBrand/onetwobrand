'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { updateOPStatus, updateProductionOrder, deleteProductionOrder } from '@/lib/production/orders';
import type { OPStatus } from '@/lib/types';

export async function changeOPStatus(opId: string, newStatus: OPStatus, note?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado.');

  await updateOPStatus(opId, newStatus, note);

  revalidatePath(`/producao`);
  revalidatePath(`/producao/${opId}`);
}

export async function editProductionOrder(_prev: { error: string }, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const opId = formData.get('opId') as string;
  if (!opId) return { error: 'ID inválido.' };

  const qty = parseInt(formData.get('qty') as string, 10);

  try {
    await updateProductionOrder(opId, {
      clientName: (formData.get('clientName') as string) || undefined,
      productName: (formData.get('productName') as string) || undefined,
      seamstressName: (formData.get('seamstressName') as string) || undefined,
      status: (formData.get('status') as OPStatus) || undefined,
      qty: isNaN(qty) ? undefined : qty,
      dueDate: (formData.get('dueDate') as string) || undefined,
      fabricUsed: (formData.get('fabricUsed') as string) || undefined,
      embroideryNotes: (formData.get('embroideryNotes') as string) || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao salvar.' };
  }

  revalidatePath('/');
  revalidatePath('/producao');
  revalidatePath(`/producao/${opId}`);
  redirect(`/producao/${opId}`);
}

export async function destroyProductionOrder(opId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado.');

  await deleteProductionOrder(opId);

  revalidatePath('/');
  revalidatePath('/producao');
  redirect('/producao');
}
