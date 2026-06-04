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
  returnedAt?: string | null;
  status: string;
  embroideryType?: string | null;
  value: number;
  linkedOps: number;
};

export type SeamstressListItem = {
  id: string;
  name: string;
  role: string;
  phone?: string | null;
  pix?: string | null;
  address?: string | null;
  specialty?: string | null;
  notes?: string | null;
  active: boolean;
  pendingShipments: number;
  pendingValue: number;
};

export type FinancialSummary = {
  revenueMonth: number;
  toReceive: number;
  toPay: number;
  expensesPaidMonth: number;
  grossProfitMonth: number;
  netProfitMonth: number;
  payables: { id: string; supplier: string; category?: string | null; amount: number; dueDate: string; status: string }[];
  receivables: { id: string; clientName: string; amount: number; dueDate: string; status: string }[];
};

export type ReportsSummary = {
  piecesSold: number;
  grossMonth: number;
  revenueMonth: number;
  topPieces: { id: string; name: string; unitsSold: number; gross: number }[];
  salesMonth: { id: string; clientName: string; total: number; status: string; piecesQty: number; grossProfit: number; paymentMethod: string; createdAt: string }[];
  productionReport: { id: string; opNumber: string; status: string; qty: number; clientName: string; pieceName: string; seamstressName: string | null; dueDate: string; overdue: boolean }[];
  embroideryReport: { id: string; code: string; status: string; qty: number; value: number; seamstressName: string; overdue: boolean; expectedReturnAt: string }[];
  lowStock: { id: string; name: string; collectionName: string | null; size: string; quantity: number; lowThreshold: number }[];
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
  { id: 'bd-118', code: 'BD-118', seamstressName: 'Maria Helena', qty: 6, sentAt: '2026-05-28', expectedReturnAt: '2026-06-07', status: 'Em Bordagem', embroideryType: 'Floral a mao', value: 1380, linkedOps: 1 },
  { id: 'bd-117', code: 'BD-117', seamstressName: 'Joana Lima', qty: 3, sentAt: '2026-05-25', expectedReturnAt: '2026-06-05', status: 'Em Bordagem', embroideryType: 'Aplicacao', value: 720, linkedOps: 1 },
  { id: 'bd-116', code: 'BD-116', seamstressName: 'Renata Souza', qty: 4, sentAt: '2026-05-15', expectedReturnAt: '2026-05-29', status: 'Finalizada', embroideryType: 'Richelieu', value: 880, linkedOps: 0 },
];

const fallbackSeamstresses: SeamstressListItem[] = [
  { id: 'maria', name: 'Maria Helena', role: 'Costureira-chefe', phone: '+5511999990001', pix: 'maria@pix', specialty: 'Bordado floral', active: true, pendingShipments: 1, pendingValue: 1380 },
  { id: 'joana', name: 'Joana Lima', role: 'Bordadeira', phone: '+5511999990002', pix: 'joana@pix', specialty: 'Aplicacoes', active: true, pendingShipments: 1, pendingValue: 720 },
  { id: 'renata', name: 'Renata Souza', role: 'Costureira', phone: '+5511999990003', specialty: 'Costura fina', active: true, pendingShipments: 0, pendingValue: 0 },
];

const fallbackFinancial: FinancialSummary = {
  revenueMonth: 0,
  toReceive: 0,
  toPay: 6420,
  expensesPaidMonth: 0,
  grossProfitMonth: 0,
  netProfitMonth: 0,
  payables: [
    { id: 'linho', supplier: 'Linho Premium', category: 'fornecedor', amount: 2840, dueDate: '2026-06-08', status: 'pending' },
    { id: 'aluguel', supplier: 'Atelier · Aluguel', category: 'aluguel', amount: 2200, dueDate: '2026-06-11', status: 'pending' },
    { id: 'maria', supplier: 'Maria Helena', category: 'bordagem', amount: 1380, dueDate: '2026-06-14', status: 'pending' },
  ],
  receivables: [],
};

const fallbackReports: ReportsSummary = {
  piecesSold: 0,
  grossMonth: 0,
  revenueMonth: 0,
  topPieces: [
    { id: 'vestido-lis', name: 'Vestido Lis', unitsSold: 0, gross: 0 },
    { id: 'blusa-iris', name: 'Blusa Íris', unitsSold: 0, gross: 0 },
    { id: 'conjunto-hera', name: 'Conjunto Hera', unitsSold: 0, gross: 0 },
  ],
  salesMonth: [],
  productionReport: [],
  embroideryReport: [],
  lowStock: [],
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

export type ClientDetail = ClientListItem & {
  email?: string | null;
  notes?: string | null;
  createdAt?: string;
  sales: { id: string; total: number; status: string; paymentMethod: string; createdAt: string }[];
  orders: { id: string; opNumber: string; productName: string; status: string; qty: number; dueDate: string }[];
};

export async function getClientDetail(clientId: string): Promise<{ client: ClientDetail | null; source: DataSource; error?: string }> {
  if (!hasSupabasePublicEnv()) return { client: null, source: 'fallback' };
  try {
    const supabase = await createClient();

    const [{ data: clientData, error: clientError }, { data: salesData }, { data: ordersData }] = await Promise.all([
      supabase
        .from('clients')
        .select('id, name, city, state, phone, email, vip, total_pieces, total_spent, notes, created_at')
        .eq('id', clientId)
        .maybeSingle(),
      supabase
        .from('sales')
        .select('id, total, status, payment_method, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('production_orders')
        .select('id, op_number, status, qty, due_date, pieces(name)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (clientError || !clientData) return { client: null, source: 'fallback', error: clientError?.message };

    const formatDate = (iso: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso));

    return {
      source: 'supabase',
      client: {
        id: clientData.id,
        name: clientData.name,
        city: clientData.city,
        state: clientData.state,
        phone: clientData.phone,
        email: clientData.email,
        vip: clientData.vip,
        totalPieces: clientData.total_pieces,
        totalSpent: Number(clientData.total_spent),
        notes: clientData.notes,
        createdAt: formatDate(clientData.created_at),
        sales: (salesData ?? []).map((s) => ({
          id: s.id,
          total: Number(s.total),
          status: s.status,
          paymentMethod: s.payment_method,
          createdAt: formatDate(s.created_at),
        })),
        orders: (ordersData ?? []).map((o) => {
          const piece = Array.isArray(o.pieces) ? o.pieces[0] : o.pieces;
          return {
            id: o.id,
            opNumber: o.op_number,
            productName: (piece as { name: string } | null)?.name ?? 'Produto',
            status: o.status,
            qty: o.qty,
            dueDate: o.due_date,
          };
        }),
      },
    };
  } catch (e) {
    return { client: null, source: 'fallback', error: e instanceof Error ? e.message : 'Erro.' };
  }
}

export type ClientShopOrder = {
  id:                string;
  orderNumber:       string;
  total:             number;
  paymentStatus:     string;
  fulfillmentStatus: string;
  itemCount:         number;
  createdAt:         string;
};

export async function getClientShopOrders(clientId: string): Promise<ClientShopOrder[]> {
  if (!hasSupabasePublicEnv()) return [];
  try {
    const supabase = await createClient();
    // Busca customer com client_id reconciliado
    const { data: custData } = await supabase
      .from('customers')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle();

    if (!custData?.id) return [];

    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total, payment_status, fulfillment_status, created_at, order_items(qty)')
      .eq('customer_id', custData.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data) return [];

    const fmt = (iso: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso));

    return data.map((o) => {
      const items = (o.order_items ?? []) as Array<{ qty: number }>;
      return {
        id:                o.id,
        orderNumber:       o.order_number,
        total:             Number(o.total),
        paymentStatus:     o.payment_status,
        fulfillmentStatus: o.fulfillment_status,
        itemCount:         items.reduce((s, i) => s + (i.qty ?? 1), 0),
        createdAt:         fmt(o.created_at),
      };
    });
  } catch {
    return [];
  }
}

type ShipmentRow = {
  id: string;
  code: string;
  qty: number;
  sent_at: string;
  expected_return_at: string;
  returned_at: string | null;
  status: string;
  embroidery_type: string | null;
  value: number;
  seamstresses: { name: string } | { name: string }[] | null;
  shipment_items: { op_id: string }[] | null;
};

export async function getEmbroideryShipments(): Promise<{ source: DataSource; shipments: EmbroideryShipmentItem[]; error?: string }> {
  try {
    const supabase = await getSupabaseOrNull();
    if (!supabase) return { source: 'fallback', shipments: fallbackShipments };

    const { data, error } = await supabase
      .from('embroidery_shipments')
      .select('id, code, qty, sent_at, expected_return_at, returned_at, status, embroidery_type, value, seamstresses(name), shipment_items(op_id)')
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
        returnedAt: item.returned_at,
        status: item.status,
        embroideryType: item.embroidery_type,
        value: Number(item.value ?? 0),
        linkedOps: item.shipment_items?.length ?? 0,
      };
    });

    return { source: shipments.length ? 'supabase' : 'fallback', shipments: shipments.length ? shipments : fallbackShipments };
  } catch (error) {
    return { source: 'fallback', shipments: fallbackShipments, error: error instanceof Error ? error.message : 'Erro ao buscar bordagens.' };
  }
}

type SeamstressRow = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  pix: string | null;
  address: string | null;
  specialty: string | null;
  notes: string | null;
  active: boolean;
  embroidery_shipments: { id: string; status: string; value: number }[] | null;
};

export async function getSeamstresses(): Promise<{ source: DataSource; seamstresses: SeamstressListItem[]; error?: string }> {
  try {
    const supabase = await getSupabaseOrNull();
    if (!supabase) return { source: 'fallback', seamstresses: fallbackSeamstresses };

    const { data, error } = await supabase
      .from('seamstresses')
      .select('id, name, role, phone, pix, address, specialty, notes, active, embroidery_shipments(id, status, value)')
      .order('name', { ascending: true });

    if (error || !data) return { source: 'fallback', seamstresses: fallbackSeamstresses, error: error?.message };

    const seamstresses = (data as SeamstressRow[]).map((item) => {
      const activeShipments = (item.embroidery_shipments ?? []).filter((shipment) => shipment.status === 'Em Bordagem');
      return {
        id: item.id,
        name: item.name,
        role: item.role,
        phone: item.phone,
        pix: item.pix,
        address: item.address,
        specialty: item.specialty,
        notes: item.notes,
        active: item.active,
        pendingShipments: activeShipments.length,
        pendingValue: activeShipments.reduce((sum, shipment) => sum + Number(shipment.value ?? 0), 0),
      };
    });

    return { source: seamstresses.length ? 'supabase' : 'fallback', seamstresses: seamstresses.length ? seamstresses : fallbackSeamstresses };
  } catch (error) {
    return { source: 'fallback', seamstresses: fallbackSeamstresses, error: error instanceof Error ? error.message : 'Erro ao buscar costureiras.' };
  }
}

export async function getFinancialSummary(): Promise<{ source: DataSource; summary: FinancialSummary; error?: string }> {
  try {
    const supabase = await getSupabaseOrNull();
    if (!supabase) return { source: 'fallback', summary: fallbackFinancial };

    const [
      { data: summary, error: summaryError },
      { data: payables, error: payablesError },
      { data: receivables, error: receivablesError },
    ] = await Promise.all([
      supabase
        .from('v_financial_summary')
        .select('revenue_month, to_receive, to_pay, expenses_paid_month, gross_profit_month')
        .single(),
      supabase
        .from('payables')
        .select('id, supplier, category, amount, due_date, status')
        .order('due_date', { ascending: true })
        .limit(12),
      supabase
        .from('receivables')
        .select('id, amount, due_date, status, clients(name)')
        .order('due_date', { ascending: true })
        .limit(12),
    ]);

    if (summaryError || payablesError || receivablesError || !summary) {
      return {
        source: 'fallback',
        summary: fallbackFinancial,
        error: summaryError?.message ?? payablesError?.message ?? receivablesError?.message,
      };
    }

    const grossProfitMonth = Number(summary.gross_profit_month);
    const expensesPaidMonth = Number(summary.expenses_paid_month);

    return {
      source: 'supabase',
      summary: {
        revenueMonth: Number(summary.revenue_month),
        toReceive: Number(summary.to_receive),
        toPay: Number(summary.to_pay),
        expensesPaidMonth,
        grossProfitMonth,
        netProfitMonth: grossProfitMonth - expensesPaidMonth,
        payables: (payables ?? []).map((item) => ({
          id: item.id,
          supplier: item.supplier,
          category: item.category,
          amount: Number(item.amount),
          dueDate: item.due_date,
          status: item.status,
        })),
        receivables: (receivables ?? []).map((item) => {
          const client = Array.isArray(item.clients) ? item.clients[0] : item.clients;
          return {
            id: item.id,
            clientName: client?.name ?? 'Cliente',
            amount: Number(item.amount),
            dueDate: item.due_date,
            status: item.status,
          };
        }),
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

    const [
      { data: topPieces, error: topError },
      { data: salesMonth },
      { data: productionReport },
      { data: embroideryReport },
      { data: lowStock },
    ] = await Promise.all([
      supabase.from('v_top_pieces').select('id, name, units_sold, gross').limit(10),
      supabase.from('v_sales_report_month').select('id, client_name, total, status, pieces_qty, gross_profit, payment_method, created_at').order('created_at', { ascending: false }).limit(30),
      supabase.from('v_production_report').select('id, op_number, status, qty, client_name, piece_name, seamstress_name, due_date, overdue'),
      supabase.from('v_embroidery_report').select('id, code, status, qty, value, seamstress_name, overdue, expected_return_at'),
      supabase.from('v_stock_low').select('id, name, collection_name, size, quantity, low_threshold').limit(20),
    ]);

    if (topError) return { source: 'fallback', summary: fallbackReports, error: topError.message };

    const pieces = topPieces ?? [];
    const piecesSold = pieces.reduce((sum, p) => sum + Number(p.units_sold), 0);
    const revenueMonth = (salesMonth ?? []).filter((s) => s.status === 'paid').reduce((sum, s) => sum + Number(s.total), 0);
    const grossMonth = (salesMonth ?? []).filter((s) => s.status === 'paid').reduce((sum, s) => sum + Number(s.gross_profit), 0);

    return {
      source: 'supabase',
      summary: {
        piecesSold,
        revenueMonth,
        grossMonth,
        topPieces: pieces.map((item) => ({
          id: item.id,
          name: item.name,
          unitsSold: Number(item.units_sold),
          gross: Number(item.gross),
        })),
        salesMonth: (salesMonth ?? []).map((s) => ({
          id: s.id,
          clientName: s.client_name,
          total: Number(s.total),
          status: s.status,
          piecesQty: Number(s.pieces_qty),
          grossProfit: Number(s.gross_profit),
          paymentMethod: s.payment_method,
          createdAt: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(s.created_at)),
        })),
        productionReport: (productionReport ?? []).map((p) => ({
          id: p.id,
          opNumber: p.op_number,
          status: p.status,
          qty: p.qty,
          clientName: p.client_name,
          pieceName: p.piece_name,
          seamstressName: p.seamstress_name,
          dueDate: p.due_date,
          overdue: Boolean(p.overdue),
        })),
        embroideryReport: (embroideryReport ?? []).map((e) => ({
          id: e.id,
          code: e.code,
          status: e.status,
          qty: e.qty,
          value: Number(e.value),
          seamstressName: e.seamstress_name,
          overdue: Boolean(e.overdue),
          expectedReturnAt: e.expected_return_at,
        })),
        lowStock: (lowStock ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          collectionName: s.collection_name,
          size: s.size,
          quantity: s.quantity,
          lowThreshold: s.low_threshold,
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

// ── KPIs da loja para /relatorios ────────────────────────────────

export type ShopKpis = {
  totalOrders:    number;
  totalRevenue:   number;
  avgOrderValue:  number;
  ordersPaid:     number;
  ordersPending:  number;
  topPieceName:   string | null;
  topPieceQty:    number;
};

export async function getShopKpis(days = 30): Promise<ShopKpis> {
  const empty: ShopKpis = {
    totalOrders: 0, totalRevenue: 0, avgOrderValue: 0,
    ordersPaid: 0, ordersPending: 0, topPieceName: null, topPieceQty: 0,
  };

  if (!hasSupabasePublicEnv()) return empty;

  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc('shop_kpis', { p_days: days });
    if (!data || !Array.isArray(data) || data.length === 0) return empty;

    const row = data[0] as {
      total_orders: number; total_revenue: number; avg_order_value: number;
      orders_paid: number; orders_pending: number;
      top_piece_name: string | null; top_piece_qty: number;
    };

    return {
      totalOrders:   Number(row.total_orders   ?? 0),
      totalRevenue:  Number(row.total_revenue  ?? 0),
      avgOrderValue: Number(row.avg_order_value ?? 0),
      ordersPaid:    Number(row.orders_paid    ?? 0),
      ordersPending: Number(row.orders_pending ?? 0),
      topPieceName:  row.top_piece_name ?? null,
      topPieceQty:   Number(row.top_piece_qty  ?? 0),
    };
  } catch {
    return empty;
  }
}
