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
  collectionName?: string | null;
  category?: string | null;
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
  pieces:
    | { name: string; price: number; category: string | null; collections: { name: string } | { name: string }[] | null }
    | { name: string; price: number; category: string | null; collections: { name: string } | { name: string }[] | null }[]
    | null;
};

function firstRelated<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export type SaleListItem = {
  id: string;
  clientName: string;
  clientId: string;
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod: string;
  itemCount: number;
  createdAt: string;
};

export type SaleDetail = SaleListItem & {
  items: {
    id: string;
    pieceName: string;
    size: string;
    color: string | null;
    qty: number;
    unitPrice: number;
  }[];
};

type SaleRow = {
  id: string;
  total: string | number;
  status: string;
  payment_method: string;
  created_at: string;
  clients: { id: string; name: string } | { id: string; name: string }[] | null;
  sale_items: { id: string }[] | null;
};

type SaleDetailRow = {
  id: string;
  total: string | number;
  status: string;
  payment_method: string;
  created_at: string;
  clients: { id: string; name: string } | { id: string; name: string }[] | null;
  sale_items: {
    id: string;
    qty: number;
    unit_price: string | number;
    stock_items: {
      size: string;
      color: string | null;
      pieces: { name: string } | { name: string }[] | null;
    } | null;
  }[] | null;
};

function firstR<T>(v: T | T[] | null): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

function formatSaleDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso));
}

export async function getSalesList(): Promise<{
  sales: SaleListItem[];
  source: 'supabase' | 'fallback';
  error?: string;
}> {
  if (!hasSupabasePublicEnv()) return { sales: [], source: 'fallback' };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sales')
      .select('id, total, status, payment_method, created_at, clients(id, name), sale_items(id)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return { sales: [], source: 'fallback', error: error?.message };

    const sales = (data as SaleRow[]).map((row) => {
      const client = firstR(row.clients);
      return {
        id: row.id,
        clientName: client?.name ?? 'Cliente',
        clientId: client?.id ?? '',
        total: Number(row.total),
        status: row.status as SaleListItem['status'],
        paymentMethod: row.payment_method,
        itemCount: row.sale_items?.length ?? 0,
        createdAt: formatSaleDate(row.created_at),
      };
    });

    return { sales, source: 'supabase' };
  } catch (e) {
    return { sales: [], source: 'fallback', error: e instanceof Error ? e.message : 'Erro.' };
  }
}

export async function getSaleDetail(saleId: string): Promise<{
  sale: SaleDetail | null;
  source: 'supabase' | 'fallback';
  error?: string;
}> {
  if (!hasSupabasePublicEnv()) return { sale: null, source: 'fallback' };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sales')
      .select(`
        id, total, status, payment_method, created_at,
        clients(id, name),
        sale_items(id, qty, unit_price,
          stock_items(size, color, pieces(name))
        )
      `)
      .eq('id', saleId)
      .maybeSingle();

    if (error || !data) return { sale: null, source: 'fallback', error: error?.message };

    const row = data as unknown as SaleDetailRow;
    const client = firstR(row.clients);

    const items = (row.sale_items ?? []).map((si) => {
      const piece = firstR(si.stock_items?.pieces ?? null);
      return {
        id: si.id,
        pieceName: piece?.name ?? 'Produto',
        size: si.stock_items?.size ?? '-',
        color: si.stock_items?.color ?? null,
        qty: si.qty,
        unitPrice: Number(si.unit_price),
      };
    });

    return {
      source: 'supabase',
      sale: {
        id: row.id,
        clientName: client?.name ?? 'Cliente',
        clientId: client?.id ?? '',
        total: Number(row.total),
        status: row.status as SaleListItem['status'],
        paymentMethod: row.payment_method,
        itemCount: items.length,
        createdAt: formatSaleDate(row.created_at),
        items,
      },
    };
  } catch (e) {
    return { sale: null, source: 'fallback', error: e instanceof Error ? e.message : 'Erro.' };
  }
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
        .select('id, piece_id, size, color, quantity, pieces(name, price, category, collections(name))')
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
        const collection = firstRelated(piece?.collections ?? null);
        return {
          id: item.id,
          pieceId: item.piece_id,
          name: piece?.name ?? 'Produto',
          collectionName: collection?.name,
          category: piece?.category,
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
