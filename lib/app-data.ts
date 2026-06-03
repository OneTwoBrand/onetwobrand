import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import type { ProductionOrderListItem } from '@/lib/production/orders';
import { fallbackProductionOrders, getProductionOrders } from '@/lib/production/orders';

export type DataSource = 'supabase' | 'fallback';

export type DashboardSummary = {
  inProduction: number;
  inEmbroidery: number;
  stockTotal: number;
  pendingOrders: number;
  revenueMonth: number;
  toReceive: number;
  toPay: number;
  grossProfitMonth: number;
  netProfitMonth: number;
  overdueOps: number;
  lowStockSkus: number;
  activeOrders: ProductionOrderListItem[];
};

export type ClientListItem = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  vip: boolean;
  totalPieces: number;
  totalSpent: number;
};

export type EmbroideryShipmentItem = {
  id: string;
  code: string;
  seamstressName: string;
  qty: number;
  sentAt: string;
  expectedReturnAt: string;
  status: string;
};

export type FinancialSummary = {
  revenueMonth: number;
  toReceive: number;
  toPay: number;
  payables: { id: string; supplier: string; category?: string | null; amount: number; dueDate: string }[];
};

export type ReportsSummary = {
  piecesSold: number;
  topPieces: { id: string; name: string; unitsSold: number; gross: number }[];
};

export type SalesSummary = {
  pendingOrders: number;
  latestSales: { id: string; clientName: string; total: number; status: string; createdAt: string }[];
};

const fallbackClients: ClientListItem[] = [
  { id: 'clara', name: 'Clara Bianchi', city: 'Rio de Janeiro', state: 'RJ', phone: '+5521988880001', vip: true, totalPieces: 18, totalSpent: 9860 },
  { id: 'beatriz', name: 'Beatriz Lacerda', city: 'Curitiba', state: 'PR', phone: '+5541988880006', vip: true, totalPieces: 7, totalSpent: 3140 },
  { id: 'ana', name: 'Ana Toledo', city: 'São Paulo', state: 'SP', phone: '+5511988880003', vip: false, totalPieces: 12, totalSpent: 6420 },
];

const fallbackShipments: EmbroideryShipmentItem[] = [
  { id: 'bd-118', code: 'BD-118', seamstressName: 'Maria Helena', qty: 6, sentAt: '2026-05-28', expectedReturnAt: '2026-06-07', status: 'Em Bordagem' },
  { id: 'bd-117', code: 'BD-117', seamstressName: 'Joana Lima', qty: 3, sentAt: '2026-05-25', expectedReturnAt: '2026-06-05', status: 'Em Bordagem' },
  { id: 'bd-116', code: 'BD-116', seamstressName: 'Renata Souza', qty: 4, sentAt: '2026-05-15', expectedReturnAt: '2026-05-29', status: 'Finalizada' },
];

const fallbackFinancial: FinancialSummary = {
  revenueMonth: 0,
  toReceive: 0,
  toPay: 6420,
  payables: [
    { id: 'linho', supplier: 'Linho Premium', category: 'fornecedor', amount: 2840, dueDate: '2026-06-08' },
    { id: 'aluguel', supplier: 'Atelier · Aluguel', category: 'aluguel', amount: 2200, dueDate: '2026-06-11' },
    { id: 'maria', supplier: 'Maria Helena', category: 'bordagem', amount: 1380, dueDate: '2026-06-14' },
  ],
};

const fallbackReports: ReportsSummary = {
  piecesSold: 0,
  topPieces: [
    { id: 'vestido-lis', name: 'Vestido Lis', unitsSold: 0, gross: 0 },
    { id: 'blusa-iris', name: 'Blusa Íris', unitsSold: 0, gross: 0 },
    { id: 'conjunto-hera', name: 'Conjunto Hera', unitsSold: 0, gross: 0 },
  ],
};

const fallbackSales: SalesSummary = {
  pendingOrders: 0,
  latestSales: [],
};

const fallbackDashboard: DashboardSummary = {
  inProduction: 1,
  inEmbroidery: 1,
  stockTotal: 47,
  pendingOrders: 0,
  revenueMonth: 0,
  toReceive: 0,
  toPay: 6420,
  grossProfitMonth: 0,
  netProfitMonth: 0,
  overdueOps: 0,
  lowStockSkus: 3,
  activeOrders: fallbackProductionOrders.slice(0, 2),
};

async function getSupabaseOrNull() {
  if (!hasSupabasePublicEnv()) return null;
  return createClient();
}

export async function getDashboardSummary(): Promise<{ source: DataSource; summary: DashboardSummary; error?: string }> {
  try {
    const supabase = await getSupabaseOrNull();
    if (!supabase) return { source: 'fallback', summary: fallbackDashboard };

    const [{ data: kpis, error: kpiError }, ordersResult] = await Promise.all([
      supabase
        .from('v_dashboard_kpis')
        .select(`
          in_production,
          in_embroidery,
          stock_total,
          pending_orders,
          revenue_month,
          to_receive,
          to_pay,
          gross_profit_month,
          net_profit_month,
          overdue_ops,
          low_stock_skus
        `)
        .single(),
      getProductionOrders(),
    ]);

    if (kpiError || !kpis) {
      return { source: 'fallback', summary: fallbackDashboard, error: kpiError?.message };
    }

    const activeOrders = ordersResult.orders
      .filter((order) => !['Finalizada', 'Vendida', 'Entregue'].includes(order.status))
      .slice(0, 4);

    return {
      source: ordersResult.source === 'supabase' ? 'supabase' : 'fallback',
      error: ordersResult.error,
      summary: {
        inProduction: Number(kpis.in_production),
        inEmbroidery: Number(kpis.in_embroidery),
        stockTotal: Number(kpis.stock_total),
        pendingOrders: Number(kpis.pending_orders),
        revenueMonth: Number(kpis.revenue_month),
        toReceive: Number(kpis.to_receive),
        toPay: Number(kpis.to_pay),
        grossProfitMonth: Number(kpis.gross_profit_month),
        netProfitMonth: Number(kpis.net_profit_month),
        overdueOps: Number(kpis.overdue_ops),
        lowStockSkus: Number(kpis.low_stock_skus),
        activeOrders: activeOrders.length ? activeOrders : fallbackDashboard.activeOrders,
      },
    };
  } catch (error) {
    return { source: 'fallback', summary: fallbackDashboard, error: error instanceof Error ? error.message : 'Erro ao buscar dashboard.' };
  }
}

export async function getClients(): Promise<{ source: DataSource; clients: ClientListItem[]; error?: string }> {
  try {
    const supabase = await getSupabaseOrNull();
    if (!supabase) return { source: 'fallback', clients: fallbackClients };

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, city, state, phone, vip, total_pieces, total_spent')
      .order('name', { ascending: true });

    if (error || !data) return { source: 'fallback', clients: fallbackClients, error: error?.message };

    return {
      source: data.length ? 'supabase' : 'fallback',
      clients: data.length
        ? data.map((client) => ({
            id: client.id,
            name: client.name,
            city: client.city,
            state: client.state,
            phone: client.phone,
            vip: client.vip,
            totalPieces: client.total_pieces,
            totalSpent: Number(client.total_spent),
          }))
        : fallbackClients,
    };
  } catch (error) {
    return { source: 'fallback', clients: fallbackClients, error: error instanceof Error ? error.message : 'Erro ao buscar clientes.' };
  }
}

type ShipmentRow = {
  id: string;
  code: string;
  qty: number;
  sent_at: string;
  expected_return_at: string;
  status: string;
  seamstresses: { name: string } | { name: string }[] | null;
};

export async function getEmbroideryShipments(): Promise<{ source: DataSource; shipments: EmbroideryShipmentItem[]; error?: string }> {
  try {
    const supabase = await getSupabaseOrNull();
    if (!supabase) return { source: 'fallback', shipments: fallbackShipments };

    const { data, error } = await supabase
      .from('embroidery_shipments')
      .select('id, code, qty, sent_at, expected_return_at, status, seamstresses(name)')
      .order('expected_return_at', { ascending: true });

    if (error || !data) return { source: 'fallback', shipments: fallbackShipments, error: error?.message };

    const shipments = (data as ShipmentRow[]).map((item) => {
      const seamstress = Array.isArray(item.seamstresses) ? item.seamstresses[0] : item.seamstresses;
      return {
        id: item.id,
        code: item.code,
        seamstressName: seamstress?.name ?? 'Costureira',
        qty: item.qty,
        sentAt: item.sent_at,
        expectedReturnAt: item.expected_return_at,
        status: item.status,
      };
    });

    return { source: shipments.length ? 'supabase' : 'fallback', shipments: shipments.length ? shipments : fallbackShipments };
  } catch (error) {
    return { source: 'fallback', shipments: fallbackShipments, error: error instanceof Error ? error.message : 'Erro ao buscar bordagens.' };
  }
}

export async function getFinancialSummary(): Promise<{ source: DataSource; summary: FinancialSummary; error?: string }> {
  try {
    const supabase = await getSupabaseOrNull();
    if (!supabase) return { source: 'fallback', summary: fallbackFinancial };

    const [{ data: kpis, error: kpiError }, { data: payables, error: payablesError }] = await Promise.all([
      supabase.from('v_dashboard_kpis').select('revenue_month, to_receive, to_pay').single(),
      supabase.from('payables').select('id, supplier, category, amount, due_date').order('due_date', { ascending: true }).limit(6),
    ]);

    if (kpiError || payablesError || !kpis) {
      return { source: 'fallback', summary: fallbackFinancial, error: kpiError?.message ?? payablesError?.message };
    }

    return {
      source: 'supabase',
      summary: {
        revenueMonth: Number(kpis.revenue_month),
        toReceive: Number(kpis.to_receive),
        toPay: Number(kpis.to_pay),
        payables: (payables ?? []).map((item) => ({
          id: item.id,
          supplier: item.supplier,
          category: item.category,
          amount: Number(item.amount),
          dueDate: item.due_date,
        })),
      },
    };
  } catch (error) {
    return { source: 'fallback', summary: fallbackFinancial, error: error instanceof Error ? error.message : 'Erro ao buscar financeiro.' };
  }
}

export async function getReportsSummary(): Promise<{ source: DataSource; summary: ReportsSummary; error?: string }> {
  try {
    const supabase = await getSupabaseOrNull();
    if (!supabase) return { source: 'fallback', summary: fallbackReports };

    const [{ data: topPieces, error: topError }] = await Promise.all([
      supabase.from('v_top_pieces').select('id, name, units_sold, gross').limit(10),
    ]);

    if (topError) return { source: 'fallback', summary: fallbackReports, error: topError.message };

    return {
      source: 'supabase',
      summary: {
        piecesSold: 0,
        topPieces: (topPieces ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          unitsSold: Number(item.units_sold),
          gross: Number(item.gross),
        })),
      },
    };
  } catch (error) {
    return { source: 'fallback', summary: fallbackReports, error: error instanceof Error ? error.message : 'Erro ao buscar relatórios.' };
  }
}

export async function getSalesSummary(): Promise<{ source: DataSource; summary: SalesSummary; error?: string }> {
  try {
    const supabase = await getSupabaseOrNull();
    if (!supabase) return { source: 'fallback', summary: fallbackSales };

    const { data, error } = await supabase
      .from('sales')
      .select('id, total, status, created_at, clients(name)')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error || !data) return { source: 'fallback', summary: fallbackSales, error: error?.message };

    return {
      source: 'supabase',
      summary: {
        pendingOrders: data.filter((sale) => sale.status === 'pending').length,
        latestSales: data.map((sale) => {
          const client = Array.isArray(sale.clients) ? sale.clients[0] : sale.clients;
          return {
            id: sale.id,
            clientName: client?.name ?? 'Cliente',
            total: Number(sale.total),
            status: sale.status,
            createdAt: sale.created_at,
          };
        }),
      },
    };
  } catch (error) {
    return { source: 'fallback', summary: fallbackSales, error: error instanceof Error ? error.message : 'Erro ao buscar vendas.' };
  }
}
