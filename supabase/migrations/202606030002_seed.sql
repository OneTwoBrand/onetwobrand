-- ════════════════════════════════════════════════════════════════════
-- ONE TWO — Seed data (dev only)
-- ════════════════════════════════════════════════════════════════════
-- Cole em supabase/migrations/0002_seed.sql ou rode em ambientes dev.
-- ────────────────────────────────────────────────────────────────────

-- Costureiras
insert into public.seamstresses (id, name, role, phone, avg_lead_days) values
  ('11111111-1111-1111-1111-111111111111', 'Maria Helena', 'Costureira-chefe', '+5511999990001', 8),
  ('11111111-1111-1111-1111-111111111112', 'Joana Lima',   'Bordadeira',       '+5511999990002', 9),
  ('11111111-1111-1111-1111-111111111113', 'Renata Souza', 'Costureira',       '+5511999990003', 7);

-- Peças
insert into public.pieces (id, name, fabric, color, sizes, price) values
  ('22222222-2222-2222-2222-222222222221', 'Vestido Lis',     'Linho',         'Cru',         '{P,M,G}',  580.00),
  ('22222222-2222-2222-2222-222222222222', 'Blusa Íris',      'Crepe',         'Terracota',   '{P,M}',    320.00),
  ('22222222-2222-2222-2222-222222222223', 'Conjunto Hera',   'Algodão Pima',  'Off-white',   '{M,G}',    690.00),
  ('22222222-2222-2222-2222-222222222224', 'Saia Margarida',  'Linho',         'Areia',       '{P,M,G}',  280.00);

-- Estoque inicial
insert into public.stock_items (piece_id, size, color, quantity, low_threshold) values
  ('22222222-2222-2222-2222-222222222221', 'P', 'Cru',       5, 3),
  ('22222222-2222-2222-2222-222222222221', 'M', 'Cru',       6, 3),
  ('22222222-2222-2222-2222-222222222221', 'G', 'Cru',       3, 3),
  ('22222222-2222-2222-2222-222222222222', 'P', 'Terracota', 4, 3),
  ('22222222-2222-2222-2222-222222222222', 'M', 'Terracota', 4, 3),
  ('22222222-2222-2222-2222-222222222223', 'M', 'Off-white', 2, 3),  -- low!
  ('22222222-2222-2222-2222-222222222223', 'G', 'Off-white', 1, 3),  -- low!
  ('22222222-2222-2222-2222-222222222224', 'P', 'Areia',     8, 3),
  ('22222222-2222-2222-2222-222222222224', 'M', 'Areia',     8, 3),
  ('22222222-2222-2222-2222-222222222224', 'G', 'Areia',     6, 3);

-- Clientes
insert into public.clients (id, name, city, state, phone, vip, total_pieces, total_spent) values
  ('33333333-3333-3333-3333-333333333331', 'Clara Bianchi',      'Rio de Janeiro', 'RJ', '+5521988880001', true,  18, 9860.00),
  ('33333333-3333-3333-3333-333333333332', 'Luiza Albuquerque',  'São Paulo',      'SP', '+5511988880002', false,  6, 2480.00),
  ('33333333-3333-3333-3333-333333333333', 'Ana Toledo',         'São Paulo',      'SP', '+5511988880003', false, 12, 6420.00),
  ('33333333-3333-3333-3333-333333333334', 'Marina Castro',      'Belo Horizonte', 'MG', '+5531988880004', false, 11, 5310.00),
  ('33333333-3333-3333-3333-333333333335', 'Bruna Falcão',       'Belo Horizonte', 'MG', '+5531988880005', false,  4, 1820.00),
  ('33333333-3333-3333-3333-333333333336', 'Beatriz Lacerda',    'Curitiba',       'PR', '+5541988880006', true,   7, 3140.00);

-- Ordens de produção
insert into public.production_orders
  (op_number, client_id, piece_id, qty, seamstress_id, due_date, status) values
  ('0241', '33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', 6,
    '11111111-1111-1111-1111-111111111111', current_date + 4, 'Em Produção'),
  ('0240', '33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', 3,
    '11111111-1111-1111-1111-111111111112', current_date + 2, 'Em Bordagem'),
  ('0239', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222224', 2,
    '11111111-1111-1111-1111-111111111113', current_date,     'Em Revisão'),
  ('0238', '33333333-3333-3333-3333-333333333334', '22222222-2222-2222-2222-222222222223', 4,
    '11111111-1111-1111-1111-111111111111', current_date + 9, 'Aguardando Material'),
  ('0237', '33333333-3333-3333-3333-333333333335', '22222222-2222-2222-2222-222222222222', 1,
    null,                                                     current_date + 12, 'Aberta');

-- Remessas de bordagem
insert into public.embroidery_shipments (code, seamstress_id, sent_at, expected_return_at, qty, status) values
  ('BD-118', '11111111-1111-1111-1111-111111111111', current_date - 6, current_date + 4, 6, 'Em Bordagem'),
  ('BD-117', '11111111-1111-1111-1111-111111111112', current_date - 9, current_date + 2, 3, 'Em Bordagem'),
  ('BD-116', '11111111-1111-1111-1111-111111111113', current_date - 18, current_date - 5, 4, 'Finalizada');

-- A pagar
insert into public.payables (supplier, category, amount, due_date) values
  ('Linho Premium',    'fornecedor', 2840.00, current_date + 5),
  ('Atelier · Aluguel','aluguel',    2200.00, current_date + 8),
  ('Maria Helena',     'bordagem',   1380.00, current_date + 11);
