-- ================================================================
-- Sprint L4 · Extensões admin para a loja
-- 1. Colunas order_source / order_number em sales
-- 2. Atualiza trigger create_sale_and_op_from_order para populá-las
-- 3. View + function de KPIs de loja para /relatorios
-- ================================================================

-- ── 1. Colunas order_source e order_number em sales ──────────────
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS order_source TEXT DEFAULT 'atelier',
  ADD COLUMN IF NOT EXISTS order_number TEXT;

CREATE INDEX IF NOT EXISTS idx_sales_order_source
  ON sales (order_source) WHERE order_source IS NOT NULL;

-- ── 2. Atualiza trigger (recria function com os novos campos) ────
-- Acrescenta: order_source = 'shop', order_number = NEW.order_number
CREATE OR REPLACE FUNCTION create_sale_and_op_from_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id UUID;
  v_sale_id   UUID;
  v_item      RECORD;
BEGIN
  -- Apenas quando payment_status muda para 'paid'
  IF NOT (OLD.payment_status IS DISTINCT FROM NEW.payment_status AND NEW.payment_status = 'paid') THEN
    RETURN NEW;
  END IF;

  -- Reconciliar customer com clients do atelier
  SELECT c.id INTO v_client_id
    FROM clients c
   WHERE lower(c.email) = lower(NEW.customer_email)
   LIMIT 1;

  IF v_client_id IS NULL THEN
    INSERT INTO clients (name, email, vip, total_pieces, total_spent)
    VALUES (NEW.customer_name, NEW.customer_email, false, 0, 0)
    RETURNING id INTO v_client_id;
  END IF;

  UPDATE customers SET client_id = v_client_id WHERE id = NEW.customer_id;

  -- Criar sale com rastreabilidade de origem
  INSERT INTO sales (
    client_id, total, discount, shipping,
    payment_method, status, notes, sold_by,
    order_source, order_number
  )
  VALUES (
    v_client_id,
    NEW.total,
    NEW.discount,
    NEW.shipping,
    'card',
    'paid',
    'Pedido loja online: ' || NEW.order_number,
    NULL,
    'shop',
    NEW.order_number
  )
  RETURNING id INTO v_sale_id;

  FOR v_item IN
    SELECT oi.piece_id, oi.piece_name, oi.size, oi.qty, oi.unit_price
    FROM order_items oi
    WHERE oi.order_id = NEW.id
  LOOP
    INSERT INTO sale_items (sale_id, piece_id, size, qty, unit_price)
    VALUES (v_sale_id, v_item.piece_id, v_item.size, v_item.qty, v_item.unit_price);

    INSERT INTO production_orders (
      op_number, client_id, piece_id, qty,
      status, order_id, order_source, created_by
    )
    VALUES (
      next_op_number(),
      v_client_id,
      v_item.piece_id,
      v_item.qty,
      'Aberta',
      NEW.id,
      'shop',
      NULL
    );
  END LOOP;

  UPDATE orders SET fulfillment_status = 'in_production' WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- ── 3. KPIs de loja: function para /relatorios ───────────────────
CREATE OR REPLACE FUNCTION shop_kpis(p_days INT DEFAULT 30)
RETURNS TABLE (
  total_orders        BIGINT,
  total_revenue       NUMERIC,
  avg_order_value     NUMERIC,
  orders_paid         BIGINT,
  orders_pending      BIGINT,
  orders_failed       BIGINT,
  top_piece_name      TEXT,
  top_piece_qty       BIGINT
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH period AS (
    SELECT id, total, payment_status
    FROM orders
    WHERE created_at >= now() - (p_days || ' days')::interval
  ),
  top_piece AS (
    SELECT p.name, SUM(oi.qty) AS qty
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN pieces p ON p.id = oi.piece_id
    WHERE o.payment_status = 'paid'
      AND o.created_at >= now() - (p_days || ' days')::interval
    GROUP BY p.name
    ORDER BY qty DESC
    LIMIT 1
  )
  SELECT
    COUNT(*)                                                        AS total_orders,
    COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END), 0) AS total_revenue,
    CASE WHEN COUNT(*) FILTER (WHERE payment_status = 'paid') > 0
         THEN ROUND(SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) /
                    COUNT(*) FILTER (WHERE payment_status = 'paid'), 2)
         ELSE 0 END                                                AS avg_order_value,
    COUNT(*) FILTER (WHERE payment_status = 'paid')                AS orders_paid,
    COUNT(*) FILTER (WHERE payment_status = 'pending')             AS orders_pending,
    COUNT(*) FILTER (WHERE payment_status = 'failed')              AS orders_failed,
    (SELECT name FROM top_piece LIMIT 1)                           AS top_piece_name,
    (SELECT qty  FROM top_piece LIMIT 1)                           AS top_piece_qty
  FROM period;
$$;
