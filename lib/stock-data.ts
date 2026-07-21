import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { demoRows } from '@/lib/demo-data';

export type StockMovementType = 'entrada' | 'saida' | 'ajuste' | 'producao' | 'venda';

export type StockMovementItem = {
  id: string;
  type: StockMovementType;
  qty: number;
  previousQty: number;
  resultingQty: number;
  referenceType?: string | null;
  notes?: string | null;
  createdAt: string;
  pieceName: string;
  size?: string | null;
  color?: string | null;
};

const fallbackMovements: StockMovementItem[] = demoRows([
  {
    id: 'fallback-entrada',
    type: 'entrada',
    qty: 8,
    previousQty: 0,
    resultingQty: 8,
    referenceType: 'manual',
    notes: 'Entrada demonstrativa',
    createdAt: new Date().toISOString(),
    pieceName: 'Vestido Lis',
    size: 'M',
    color: 'Cru',
  },
  {
    id: 'fallback-ajuste',
    type: 'ajuste',
    qty: 2,
    previousQty: 5,
    resultingQty: 3,
    referenceType: 'manual',
    notes: 'Ajuste demonstrativo',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    pieceName: 'Conjunto Hera',
    size: 'Único',
    color: 'Off-white',
  },
]);

type MovementRow = {
  id: string;
  type: StockMovementType;
  qty: number;
  previous_qty: number;
  resulting_qty: number;
  reference_type: string | null;
  notes: string | null;
  created_at: string;
  size: string | null;
  color: string | null;
  pieces:
    | { name: string }
    | { name: string }[]
    | null;
};

function firstRelated<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function getStockMovements(limit = 8): Promise<{ movements: StockMovementItem[]; source: 'supabase' | 'fallback'; error?: string }> {
  if (!hasSupabasePublicEnv()) return { movements: fallbackMovements, source: 'fallback' };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        id,
        type,
        qty,
        previous_qty,
        resulting_qty,
        reference_type,
        notes,
        created_at,
        size,
        color,
        pieces(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return { movements: fallbackMovements, source: 'fallback', error: error.message };

    return {
      source: 'supabase',
      movements: ((data ?? []) as MovementRow[]).map((movement) => {
        const piece = firstRelated(movement.pieces);
        return {
          id: movement.id,
          type: movement.type,
          qty: Number(movement.qty ?? 0),
          previousQty: Number(movement.previous_qty ?? 0),
          resultingQty: Number(movement.resulting_qty ?? 0),
          referenceType: movement.reference_type,
          notes: movement.notes,
          createdAt: movement.created_at,
          pieceName: piece?.name ?? 'Produto',
          size: movement.size,
          color: movement.color,
        };
      }),
    };
  } catch (error) {
    return { movements: fallbackMovements, source: 'fallback', error: error instanceof Error ? error.message : 'Erro ao buscar movimentações.' };
  }
}
