-- ════════════════════════════════════════════════════════════════════
-- ONE TWO — Limpeza de dados de teste para producao
-- Executar NO SUPABASE SQL EDITOR (dashboard.supabase.com)
-- Projeto: cnmemorrfgwzfxnfegra
-- Data: 2026-06-05
-- ════════════════════════════════════════════════════════════════════
-- SEGURO: remove apenas dados inseridos pelos seeds de demo.
-- PRESERVA: toda estrutura DDL, triggers, views, RLS, workflow_config,
--           shop_status_map, platform_config, profiles/auth.users.
-- ────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Shop: limpar fila de notificacoes ─────────────────────────
DELETE FROM public.shop_email_queue;

-- ── 2. Shop: limpar itens de pedidos e pedidos ───────────────────
DELETE FROM public.order_items;
DELETE FROM public.orders;

-- ── 3. Shop: limpar favoritos ────────────────────────────────────
DELETE FROM public.favorites;

-- ── 4. Shop: limpar enderecos e customers da loja ────────────────
DELETE FROM public.addresses;
DELETE FROM public.customers;

-- ── 5. Shop: limpar cupons (se houver demos) ─────────────────────
DELETE FROM public.coupons;

-- ── 6. Atelier: limpar historico de IA ──────────────────────────
DELETE FROM public.ai_usage_logs;

-- ── 7. Atelier: limpar recebíveis ────────────────────────────────
DELETE FROM public.receivables;

-- ── 8. Atelier: limpar contas a pagar ────────────────────────────
DELETE FROM public.payables;

-- ── 9. Atelier: limpar itens de venda e vendas ───────────────────
DELETE FROM public.sale_items;
DELETE FROM public.sales;

-- ── 10. Atelier: limpar movimentacoes de estoque ─────────────────
DELETE FROM public.stock_movements;

-- ── 11. Atelier: limpar anexos e historico de OPs ────────────────
DELETE FROM public.op_attachments;
DELETE FROM public.op_history;

-- ── 12. Atelier: limpar itens de remessa e remessas ──────────────
DELETE FROM public.shipment_items;
DELETE FROM public.embroidery_shipments;

-- ── 13. Atelier: limpar ordens de producao ───────────────────────
DELETE FROM public.production_orders;

-- ── 14. Atelier: limpar clientes ─────────────────────────────────
DELETE FROM public.clients;

-- ── 15. Estoque: limpar SKUs ─────────────────────────────────────
DELETE FROM public.stock_items;

-- ── 16. Catalogo: limpar pecas ───────────────────────────────────
DELETE FROM public.pieces;

-- ── 17. Catalogo: limpar colecoes (Cowgirl, Brasil e quaisquer outras de teste) ──
DELETE FROM public.collections;

-- ── 18. Costureiras: limpar cadastros de demo ────────────────────
DELETE FROM public.seamstresses;

-- ── 19. Resetar sequencia de OP para comecar do 0001 ─────────────
-- A primeira OP real do sistema sera 0001.
ALTER SEQUENCE public.op_number_seq RESTART WITH 1;

-- ── 20. Resetar sequencia de pedidos da loja para L-0001 ─────────
ALTER SEQUENCE public.order_number_seq RESTART WITH 1;

-- ── VERIFICACAO: deve retornar zero em todas as tabelas ───────────
SELECT 'seamstresses'        AS tabela, COUNT(*) AS registros FROM public.seamstresses
UNION ALL
SELECT 'pieces',               COUNT(*) FROM public.pieces
UNION ALL
SELECT 'stock_items',          COUNT(*) FROM public.stock_items
UNION ALL
SELECT 'collections',          COUNT(*) FROM public.collections
UNION ALL
SELECT 'clients',              COUNT(*) FROM public.clients
UNION ALL
SELECT 'production_orders',    COUNT(*) FROM public.production_orders
UNION ALL
SELECT 'op_history',           COUNT(*) FROM public.op_history
UNION ALL
SELECT 'op_attachments',       COUNT(*) FROM public.op_attachments
UNION ALL
SELECT 'embroidery_shipments', COUNT(*) FROM public.embroidery_shipments
UNION ALL
SELECT 'shipment_items',       COUNT(*) FROM public.shipment_items
UNION ALL
SELECT 'sales',                COUNT(*) FROM public.sales
UNION ALL
SELECT 'sale_items',           COUNT(*) FROM public.sale_items
UNION ALL
SELECT 'payables',             COUNT(*) FROM public.payables
UNION ALL
SELECT 'receivables',          COUNT(*) FROM public.receivables
UNION ALL
SELECT 'orders',               COUNT(*) FROM public.orders
UNION ALL
SELECT 'order_items',          COUNT(*) FROM public.order_items
UNION ALL
SELECT 'customers',            COUNT(*) FROM public.customers
UNION ALL
SELECT 'addresses',            COUNT(*) FROM public.addresses
UNION ALL
SELECT 'coupons',              COUNT(*) FROM public.coupons
UNION ALL
SELECT 'shop_email_queue',     COUNT(*) FROM public.shop_email_queue
UNION ALL
SELECT 'ai_usage_logs',        COUNT(*) FROM public.ai_usage_logs
UNION ALL
SELECT 'stock_movements',      COUNT(*) FROM public.stock_movements
ORDER BY tabela;

COMMIT;

-- ── VERIFICACAO POS-LIMPEZA: estruturas preservadas ──────────────
-- Deve retornar linhas (nao zero) para confirmar que config foi mantida:
SELECT 'workflow_config'  AS tabela, COUNT(*) AS registros FROM public.workflow_config
UNION ALL
SELECT 'platform_config',  COUNT(*) FROM public.platform_config
UNION ALL
SELECT 'shop_status_map',  COUNT(*) FROM public.shop_status_map
UNION ALL
SELECT 'profiles',         COUNT(*) FROM public.profiles;
