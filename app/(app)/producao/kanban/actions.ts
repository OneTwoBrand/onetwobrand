'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { OPStatus } from '@/lib/types';

export async function moveOP(opId: string, newStatus: OPStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado.');

  const { error } = await supabase
    .from('production_orders')
    .update({ status: newStatus })
    .eq('id', opId);

  if (error) throw new Error(error.message);

  await supabase.from('op_history').insert({
    op_id: opId,
    type: 'Sistema',
    note: `Status alterado para ${newStatus} via Kanban`,
  });

  revalidatePath('/producao');
}
