import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import type { OPStatus } from '@/lib/types';
import type { ProductionOrderForm } from './schema';

export type ProductionOrderListItem = {
  id?: string;
  opNumber: string;
  productName: string;
  clientName: string;
  qty: number;
  seamstressName?: string;
  dueDate: string;
  status: OPStatus;
};

export const fallbackProductionOrders: ProductionOrderListItem[] = [
  {
    opNumber: '0241',
    productName: 'Vestido Lis — Linho cru',
    clientName: 'Clara Bianchi',
    qty: 6,
    seamstressName: 'Maria Helena',
    dueDate: '2026-06-07',
    status: 'Em Produção',
  },
  {
    opNumber: '0242',
    productName: 'Blusa Íris — Crepe terracota',
    clientName: 'Beatriz Lacerda',
    qty: 3,
    seamstressName: 'Joana Lima',
    dueDate: '2026-06-05',
    status: 'Em Bordagem',
  },
  {
    opNumber: '0243',
    productName: 'Saia Margarida — Algodão',
    clientName: 'Ana Toledo',
    qty: 2,
    seamstressName: 'Carla Nunes',
    dueDate: '2026-06-10',
    status: 'Aberta',
  },
];

type RelatedRecord<T> = T | T[] | null;

type ProductionOrderRow = {
  id: string;
  op_number: string;
  qty: number;
  due_date: string;
  status: OPStatus;
  clients: RelatedRecord<{ name: string }>;
  pieces: RelatedRecord<{ name: string; fabric: string | null; color: string | null }>;
  seamstresses: RelatedRecord<{ name: string }>;
};

function firstRelated<T>(value: RelatedRecord<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function formatPieceName(piece: { name: string; fabric: string | null; color: string | null } | null) {
  if (!piece) return 'Peça sem cadastro';

  const detail = piece.fabric || piece.color;
  return detail ? `${piece.name} — ${detail}` : piece.name;
}

export async function getProductionOrders(): Promise<{
  orders: ProductionOrderListItem[];
  source: 'supabase' | 'fallback';
  error?: string;
}> {
  if (!hasSupabasePublicEnv()) {
    return { orders: fallbackProductionOrders, source: 'fallback' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('production_orders')
      .select(`
        id,
        op_number,
        qty,
        due_date,
        status,
        clients(name),
        pieces(name, fabric, color),
        seamstresses(name)
      `)
      .order('due_date', { ascending: true });

    if (error || !data) {
      return {
        orders: fallbackProductionOrders,
        source: 'fallback',
        error: error?.message,
      };
    }

    const orders = (data as ProductionOrderRow[]).map((row) => {
      const client = firstRelated(row.clients);
      const piece = firstRelated(row.pieces);
      const seamstress = firstRelated(row.seamstresses);

      return {
        id: row.id,
        opNumber: row.op_number,
        productName: formatPieceName(piece),
        clientName: client?.name ?? 'Cliente sem cadastro',
        qty: row.qty,
        seamstressName: seamstress?.name,
        dueDate: row.due_date,
        status: row.status,
      };
    });

    return {
      orders: orders.length ? orders : fallbackProductionOrders,
      source: orders.length ? 'supabase' : 'fallback',
    };
  } catch (error) {
    return {
      orders: fallbackProductionOrders,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar OPs.',
    };
  }
}

async function findOrCreateClient(supabase: Awaited<ReturnType<typeof createClient>>, name: string) {
  const existing = await supabase
    .from('clients')
    .select('id')
    .ilike('name', name)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id as string;

  const created = await supabase
    .from('clients')
    .insert({ name })
    .select('id')
    .single();

  if (created.error || !created.data?.id) {
    throw new Error(created.error?.message ?? 'Nao foi possivel criar cliente.');
  }

  return created.data.id as string;
}

async function findOrCreatePiece(supabase: Awaited<ReturnType<typeof createClient>>, data: ProductionOrderForm) {
  const existing = await supabase
    .from('pieces')
    .select('id')
    .ilike('name', data.productName)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id as string;

  const created = await supabase
    .from('pieces')
    .insert({
      name: data.productName,
      fabric: data.model,
      color: data.color,
      sizes: [data.size],
      price: 0,
    })
    .select('id')
    .single();

  if (created.error || !created.data?.id) {
    throw new Error(created.error?.message ?? 'Nao foi possivel criar produto.');
  }

  return created.data.id as string;
}

async function findOrCreateSeamstress(supabase: Awaited<ReturnType<typeof createClient>>, name: string) {
  const existing = await supabase
    .from('seamstresses')
    .select('id')
    .ilike('name', name)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id as string;

  const created = await supabase
    .from('seamstresses')
    .insert({ name, role: 'Costureira' })
    .select('id')
    .single();

  if (created.error || !created.data?.id) {
    throw new Error(created.error?.message ?? 'Nao foi possivel criar costureira.');
  }

  return created.data.id as string;
}

export async function createProductionOrder(data: ProductionOrderForm) {
  if (!hasSupabasePublicEnv()) {
    throw new Error('Supabase ainda nao foi configurado neste ambiente.');
  }

  const supabase = await createClient();
  const clientId = await findOrCreateClient(supabase, data.clientName);
  const pieceId = await findOrCreatePiece(supabase, data);
  const seamstressId = await findOrCreateSeamstress(supabase, data.seamstressName);
  const opNumberResult = await supabase.rpc('next_op_number');

  if (opNumberResult.error || !opNumberResult.data) {
    throw new Error(opNumberResult.error?.message ?? 'Nao foi possivel gerar numero da OP.');
  }

  const notes = [
    `Colecao: ${data.collection}`,
    `Modelo: ${data.model}`,
    `Cor: ${data.color}`,
    `Tamanho: ${data.size}`,
    `Bordagem: ${data.embroideryType}`,
    data.observations ? `Observacoes: ${data.observations}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const created = await supabase
    .from('production_orders')
    .insert({
      op_number: opNumberResult.data,
      client_id: clientId,
      piece_id: pieceId,
      qty: data.quantity,
      seamstress_id: seamstressId,
      due_date: data.dueDate,
      status: 'Aberta',
      fabric_used: data.model,
      embroidery_notes: notes,
    })
    .select('id, op_number')
    .single();

  if (created.error || !created.data) {
    throw new Error(created.error?.message ?? 'Nao foi possivel criar OP.');
  }

  return {
    id: created.data.id as string,
    opNumber: created.data.op_number as string,
  };
}
