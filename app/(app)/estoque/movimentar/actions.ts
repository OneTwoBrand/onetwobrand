'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import type { StockMovementType } from '@/lib/stock-data';

export type StockMovementActionState = { error?: string };

const manualTypes = new Set<StockMovementType>(['entrada', 'saida', 'ajuste']);

export async function createStockMovement(
  _prev: StockMovementActionState,
  formData: FormData
): Promise<StockMovementActionState> {
  const stockItemId = String(formData.get('stock_item_id') ?? '').trim();
  const type = String(formData.get('type') ?? '').trim() as StockMovementType;
  const requestedQty = parseInt(String(formData.get('qty') ?? '0'), 10);
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (!stockItemId) return { error: 'Selecione um SKU.' };
  if (!manualTypes.has(type)) return { error: 'Tipo de movimentação inválido.' };
  if (!Number.isFinite(requestedQty) || requestedQty < 0) return { error: 'Informe uma quantidade válida.' };
  if (type !== 'ajuste' && requestedQty <= 0) return { error: 'A quantidade deve ser maior que zero.' };

  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Faça login para movimentar estoque.' };

  const { data: stockItem, error: stockError } = await supabase
    .from('stock_items')
    .select('id, piece_id, size, color, quantity')
    .eq('id', stockItemId)
    .single();

  if (stockError || !stockItem) return { error: stockError?.message ?? 'SKU não encontrado.' };

  const previousQty = Number(stockItem.quantity ?? 0);
  let resultingQty = previousQty;
  let movementQty = requestedQty;

  if (type === 'entrada') {
    resultingQty = previousQty + requestedQty;
  }

  if (type === 'saida') {
    if (requestedQty > previousQty) return { error: 'Saída maior que o saldo disponível.' };
    resultingQty = previousQty - requestedQty;
  }

  if (type === 'ajuste') {
    resultingQty = requestedQty;
    movementQty = Math.abs(resultingQty - previousQty);
    if (resultingQty === previousQty) return { error: 'O novo saldo precisa ser diferente do saldo atual.' };
  }

  const { error: updateError } = await supabase
    .from('stock_items')
    .update({ quantity: resultingQty, updated_at: new Date().toISOString() })
    .eq('id', stockItemId);

  if (updateError) return { error: updateError.message };

  const { error: movementError } = await supabase
    .from('stock_movements')
    .insert({
      stock_item_id: stockItem.id,
      piece_id: stockItem.piece_id,
      size: stockItem.size,
      color: stockItem.color,
      type,
      qty: movementQty,
      previous_qty: previousQty,
      resulting_qty: resultingQty,
      reference_type: 'manual',
      notes,
      created_by: user.id,
    });

  if (movementError) {
    await supabase
      .from('stock_items')
      .update({ quantity: previousQty, updated_at: new Date().toISOString() })
      .eq('id', stockItemId);

    return { error: movementError.message };
  }

  revalidatePath('/estoque');
  redirect('/estoque');
}
