'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { updateOPStatus } from '@/lib/production/orders';
import type { OPStatus } from '@/lib/types';

export async function changeOPStatus(opId: string, newStatus: OPStatus, note?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado.');

  await updateOPStatus(opId, newStatus, note);

  revalidatePath(`/producao`);
  revalidatePath(`/producao/${opId}`);
}
