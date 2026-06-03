import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export type SaleClientOption = {
  id: string;
  name: string;
};

export type SaleStockOption = {
  id: string;
  pieceId: string;
  name: string;
  size: string;
  color?: string | null;
  quantity: number;
  price: number;
};

type StockOptionRow = {
  id: string;
  piece_id: string;
  size: string;
  color: string | null;
  quantity: number;
  pieces: { name: string; price: number } | { name: string; price: number }[] | null;
};

function firstRelated<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function getSaleFormOptions(): Promise<{
  clients: SaleClientOption[];
  stock: SaleStockOption[];
  source: 'supabase' | 'fallback';
  error?: string;
}> {
  if (!hasSupabasePublicEnv()) {
    return { clients: [], stock: [], source: 'fallback' };
  }

  try {
    const supabase = await createClient();
    const [
      { data: clients, error: clientsError },
      { data: stock, error: stockError },
    ] = await Promise.all([
      supabase.from('clients').select('id, name').order('name', { ascending: true }),
      supabase
        .from('stock_items')
        .select('id, piece_id, size, color, quantity, pieces(name, price)')
        .gt('quantity', 0)
        .order('updated_at', { ascending: false }),
    ]);

    if (clientsError || stockError) {
      return { clients: [], stock: [], source: 'fallback', error: clientsError?.message ?? stockError?.message };
    }

    return {
      source: 'supabase',
      clients: (clients ?? []).map((client) => ({
        id: client.id,
        name: client.name,
      })),
      stock: ((stock ?? []) as StockOptionRow[]).map((item) => {
        const piece = firstRelated(item.pieces);
        return {
          id: item.id,
          pieceId: item.piece_id,
          name: piece?.name ?? 'Produto',
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: Number(piece?.price ?? 0),
        };
      }),
    };
  } catch (error) {
    return { clients: [], stock: [], source: 'fallback', error: error instanceof Error ? error.message : 'Erro ao buscar dados da venda.' };
  }
}
