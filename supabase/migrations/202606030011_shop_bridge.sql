-- ================================================================
-- Sprint L3 · Ponte Loja ↔ Atelier
-- 1. View shop_op_status_map: mapeia op_status → estágio + progresso
-- 2. Trigger trg_notify_shop_customer: envia e-mail via app layer
--    (insere em shop_email_queue quando op_history é criado para
--     production_orders com order_source='shop')
-- ================================================================

-- ── 1. Mapeamento op_status → estágio público ───────────────────
-- Tabela de configuração (editável pelo admin sem nova migration)
CREATE TABLE IF NOT EXISTS shop_status_map (
  op_status    TEXT PRIMARY KEY,
  stage_label  TEXT NOT NULL,
  stage_key    TEXT NOT NULL,  -- 'confirmed' | 'production' | 'finishing' | 'shipped' | 'delivered'
  progress_pct SMALLINT NOT NULL CHECK (progress_pct BETWEEN 0 AND 100),
  sort_order   SMALLINT NOT NULL DEFAULT 0
);

-- Seed padrão alinhado com workflow ONE TWO
INSERT INTO shop_status_map (op_status, stage_label, stage_key, progress_pct, sort_order)
VALUES
  ('Aberta',            'Pedido confirmado',  'confirmed',   10, 10),
  ('Aguardando',        'Pedido confirmado',  'confirmed',   10, 20),
  ('Em Produção',       'Em produção',        'production',  40, 30),
  ('Em Bordagem',       'Em produção',        'production',  55, 40),
  ('Em Acabamento',     'Acabamento final',   'finishing',   75, 50),
  ('Controle Quality',  'Acabamento final',   'finishing',   85, 60),
  ('Pronta para Envio', 'Pronto para envio',  'shipped',     90, 70),
  ('Enviada',           'A caminho',          'shipped',     95, 80),
  ('Entregue',          'Entregue',           'delivered',  100, 90),
  ('Cancelada',         'Cancelado',          'cancelled',    0, 99)
ON CONFLICT (op_status) DO NOTHING;

-- ── 2. Fila de e-mails para notificação de cliente ──────────────
-- A rota /api/shop/op-notify consome esta fila (chamada via trigger).
-- Evita network I/O direto no trigger (padrão seguro no Postgres).
CREATE TABLE IF NOT EXISTS shop_email_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  op_id       UUID NOT NULL,
  stage_key   TEXT NOT NULL,
  progress_pct SMALLINT NOT NULL,
  queued_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at     TIMESTAMPTZ,
  error       TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_queue_unsent
  ON shop_email_queue (queued_at)
  WHERE sent_at IS NULL;

ALTER TABLE shop_email_queue ENABLE ROW LEVEL SECURITY;
-- apenas service_role acessa
CREATE POLICY "email_queue service only" ON shop_email_queue
  USING (false) WITH CHECK (false);

-- ── 3. Trigger: op_history INSERT → enfileira notificação ───────
CREATE OR REPLACE FUNCTION fn_enqueue_shop_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order_id   UUID;
  v_stage_key  TEXT;
  v_progress   SMALLINT;
  v_op_status  TEXT;
BEGIN
  -- só interessa OPs originadas da loja
  SELECT po.order_id, po.status::text
    INTO v_order_id, v_op_status
    FROM production_orders po
   WHERE po.id = NEW.op_id
     AND po.order_source = 'shop'
     AND po.order_id IS NOT NULL;

  IF v_order_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- resolve mapeamento
  SELECT stage_key, progress_pct
    INTO v_stage_key, v_progress
    FROM shop_status_map
   WHERE op_status = v_op_status;

  IF v_stage_key IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO shop_email_queue (order_id, op_id, stage_key, progress_pct)
  VALUES (v_order_id, NEW.op_id, v_stage_key, v_progress)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_shop_notification ON op_history;
CREATE TRIGGER trg_enqueue_shop_notification
  AFTER INSERT ON op_history
  FOR EACH ROW
  EXECUTE FUNCTION fn_enqueue_shop_notification();

-- ── 4. RLS pública read-only em shop_status_map ─────────────────
ALTER TABLE shop_status_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_status_map public read" ON shop_status_map
  FOR SELECT USING (true);

-- ── 5. Helper function: status de um pedido pelo order_id ───────
CREATE OR REPLACE FUNCTION shop_order_progress(p_order_id UUID)
RETURNS TABLE (
  op_id        UUID,
  op_number    TEXT,
  op_status    TEXT,
  stage_label  TEXT,
  stage_key    TEXT,
  progress_pct SMALLINT,
  updated_at   TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    po.id                       AS op_id,
    po.op_number                AS op_number,
    po.status                   AS op_status,
    COALESCE(sm.stage_label, po.status::text) AS stage_label,
    COALESCE(sm.stage_key, 'production')  AS stage_key,
    COALESCE(sm.progress_pct, 40)         AS progress_pct,
    po.updated_at
  FROM production_orders po
  LEFT JOIN shop_status_map sm ON sm.op_status = po.status::text
  WHERE po.order_id = p_order_id
  ORDER BY po.created_at ASC;
$$;

-- ── 6. Coluna updated_at em production_orders (se ausente) ──────
ALTER TABLE production_orders
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_production_orders_updated_at ON production_orders;
CREATE TRIGGER trg_production_orders_updated_at
  BEFORE UPDATE ON production_orders
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
