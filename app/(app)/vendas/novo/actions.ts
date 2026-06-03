'use server';

import { redirect } from 'next/navigation';
import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export type SaleActionState = { error?: string };

const paymentMethods = new Set(['pix', 'cash', 'debit', 'credit', 'installment', 'card', 'transfer']);
const saleStatuses = new Set(['pending', 'paid']);

type StockRow = {
  id: string;
  piece_id: string;
  size: string;
  color: string | null;
  quantity: number;
  pieces: { price: number } | { price: number }[] | null;
};

function firstRelated<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function createSale(_prev: SaleActionState, formData: FormData): Promise<SaleActionState> {
  if (!hasSupabasePublicEnv()) return { error: 'Supabase não configurado.' };

  const clientId = String(formData.get('client_id') ?? '').trim();
  const paymentMethod = String(formData.get('payment_method') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (!clientId) return { error: 'Selecione uma cliente.' };
  if (!paymentMethods.has(paymentMethod)) return { error: 'Selecione uma forma de pagamento válida.' };
  if (!saleStatuses.has(status)) return { error: 'Selecione um status válido.' };

  const selected = [1, 2, 3]
    .map((index) => ({
      stockItemId: String(formData.get(`stock_item_${index}`) ?? '').trim(),
      qty: Number.parseInt(String(formData.get(`qty_${index}`) ?? '0'), 10) || 0,
    }))
    .filter((item) => item.stockItemId && item.qty > 0);

  if (!selected.length) return { error: 'Inclua ao menos uma peça na venda.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Faça login para registrar vendas.' };

  const stockIds = selected.map((item) => item.stockItemId);
  const { data: stockRows, error: stockError } = await supabase
    .from('stock_items')
    .select('id, piece_id, size, color, quantity, pieces(price)')
    .in('id', stockIds);

  if (stockError || !stockRows?.length) {
    return { error: stockError?.message ?? 'Não foi possível carregar o estoque selecionado.' };
  }

  const stockById = new Map((stockRows as StockRow[]).map((row) => [row.id, row]));
  const saleItems = [];

  for (const item of selected) {
    const stock = stockById.get(item.stockItemId);
    if (!stock) return { error: 'Uma peça selecionada não foi encontrada no estoque.' };
    if (item.qty > stock.quantity) {
      return { error: `Quantidade indisponível para uma peça selecionada. Disponível: ${stock.quantity}.` };
    }

    const piece = firstRelated(stock.pieces);
    saleItems.push({
      piece_id: stock.piece_id,
      size: stock.size,
      qty: item.qty,
      unit_price: Number(piece?.price ?? 0),
    });
  }

  const total = saleItems.reduce((sum, item) => sum + item.qty * item.unit_price, 0);

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      client_id: clientId,
      total,
      payment_method: paymentMethod,
      status: 'pending',
      notes,
      sold_by: user.id,
    })
    .select('id')
    .single();

  if (saleError || !sale) return { error: saleError?.message ?? 'Não foi possível criar a venda.' };

  const { error: itemError } = await supabase
    .from('sale_items')
    .insert(saleItems.map((item) => ({ ...item, sale_id: sale.id })));

  if (itemError) return { error: itemError.message };

  if (status === 'paid') {
    const { error: paidError } = await supabase
      .from('sales')
      .update({ status: 'paid' })
      .eq('id', sale.id);

    if (paidError) return { error: paidError.message };
  }

  redirect('/vendas');
}
