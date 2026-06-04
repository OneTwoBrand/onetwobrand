-- ================================================================
-- Sprint L2 · Shop checkout
-- Tabelas: customers, addresses, coupons, orders, order_items.
-- Trigger: pagamento aprovado → cria production_order automaticamente.
-- ================================================================

-- ── 1. Customers (clientes da loja, reconciliam com clients do atelier) ──
CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_customers_email  ON customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_client ON customers (client_id) WHERE client_id IS NOT NULL;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- cliente vê e edita apenas seus próprios dados
CREATE POLICY "customers owner all" ON customers
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- ── 2. Addresses ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT 'Casa',
  street      TEXT NOT NULL,
  number      TEXT,
  complement  TEXT,
  district    TEXT,
  city        TEXT NOT NULL,
  state       CHAR(2) NOT NULL,
  cep         TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses (customer_id);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses owner all" ON addresses
  USING (
    customer_id IN (SELECT id FROM customers WHERE auth.uid()::text = id::text)
  )
  WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE auth.uid()::text = id::text)
  );

-- ── 3. Coupons ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  code         TEXT PRIMARY KEY,
  kind         TEXT NOT NULL CHECK (kind IN ('percent', 'fixed')),
  value        NUMERIC NOT NULL CHECK (value > 0),
  min_subtotal NUMERIC NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ,
  max_uses     INT,
  uses         INT NOT NULL DEFAULT 0,
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- leitura pública para validação de cupom no checkout
CREATE POLICY "coupons public read" ON coupons
  FOR SELECT USING (active = true);

-- apenas admins gerenciam
CREATE POLICY "coupons admin write" ON coupons
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. Orders (pedidos da loja) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT UNIQUE NOT NULL,   -- ex: "L-0001"
  customer_id      UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  subtotal         NUMERIC NOT NULL DEFAULT 0,
  discount         NUMERIC NOT NULL DEFAULT 0,
  shipping         NUMERIC NOT NULL DEFAULT 0,
  total            NUMERIC NOT NULL DEFAULT 0,
  coupon_code      TEXT REFERENCES coupons(code) ON DELETE SET NULL,
  payment_method   TEXT NOT NULL CHECK (payment_method IN ('card', 'pix', 'boleto')),
  payment_status   TEXT NOT NULL DEFAULT 'pending'
                     CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  mercadopago_payment_id   TEXT,
  fulfillment_status TEXT NOT NULL DEFAULT 'pending'
                       CHECK (fulfillment_status IN ('pending', 'in_production', 'shipped', 'delivered')),
  shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  shipping_carrier  TEXT,
  tracking_code     TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sequência para order_number
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION next_order_number()
RETURNS TEXT LANGUAGE sql AS $$
  SELECT 'L-' || LPAD(nextval('order_number_seq')::text, 4, '0');
$$;

CREATE INDEX IF NOT EXISTS idx_orders_customer        ON orders (customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_status  ON orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created         ON orders (created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- cliente vê seus próprios pedidos
CREATE POLICY "orders owner read" ON orders
  FOR SELECT
  USING (
    customer_id IN (SELECT id FROM customers WHERE auth.uid()::text = id::text)
    OR auth.uid()::text = customer_email  -- guest checkout pelo email
  );

-- insert via server action (service role)
CREATE POLICY "orders service insert" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "orders service update" ON orders
  FOR UPDATE USING (true);

-- ── 5. Order items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  piece_id   UUID NOT NULL REFERENCES pieces(id),
  piece_name TEXT NOT NULL,
  size       TEXT NOT NULL,
  color      TEXT,
  qty        INT NOT NULL CHECK (qty > 0),
  unit_price NUMERIC NOT NULL,
  photo_url  TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items owner read" ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id IN (SELECT id FROM customers WHERE auth.uid()::text = id::text)
    )
  );

CREATE POLICY "order_items service insert" ON order_items
  FOR INSERT WITH CHECK (true);

-- ── 6. Campos novos em production_orders ────────────────────────
ALTER TABLE production_orders
  ADD COLUMN IF NOT EXISTS order_id     UUID REFERENCES orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_source TEXT NOT NULL DEFAULT 'atelier';

CREATE INDEX IF NOT EXISTS idx_op_order ON production_orders (order_id) WHERE order_id IS NOT NULL;

-- ── 7. Trigger: pedido pago → cria production_order ─────────────
-- Também replica lógica financeira: cria sale + sale_items para que
-- os triggers existentes (trg_sale_paid) contabilizem no atelier.

CREATE OR REPLACE FUNCTION create_sale_and_op_from_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id   UUID;
  v_sale_id     UUID;
  v_item        RECORD;
BEGIN
  -- só executa quando status muda para 'paid'
  IF NEW.payment_status <> 'paid' OR OLD.payment_status = 'paid' THEN
    RETURN NEW;
  END IF;

  -- Tentar reconciliar customer com client do atelier pelo e-mail
  SELECT c.id INTO v_client_id
  FROM clients c
  WHERE lower(c.email) = lower(NEW.customer_email)
  LIMIT 1;

  -- Se não existe, criar client novo no atelier
  IF v_client_id IS NULL THEN
    INSERT INTO clients (name, email, vip, total_pieces, total_spent)
    VALUES (NEW.customer_name, NEW.customer_email, false, 0, 0)
    RETURNING id INTO v_client_id;
  END IF;

  -- Atualizar customer com client_id reconciliado
  UPDATE customers SET client_id = v_client_id WHERE id = NEW.customer_id;

  -- Criar sale no módulo de vendas do atelier (reutiliza trigger trg_sale_paid)
  INSERT INTO sales (client_id, total, discount, shipping, payment_method, status, notes, sold_by)
  VALUES (
    v_client_id,
    NEW.total,
    NEW.discount,
    NEW.shipping,
    'card',   -- normalizado: gateway processou
    'paid',   -- já aprovado
    'Pedido loja online: ' || NEW.order_number,
    NULL
  )
  RETURNING id INTO v_sale_id;

  -- Inserir sale_items e criar OPs por item
  FOR v_item IN
    SELECT oi.piece_id, oi.piece_name, oi.size, oi.qty, oi.unit_price
    FROM order_items oi
    WHERE oi.order_id = NEW.id
  LOOP
    -- sale_item (ativa o trigger trg_sale_paid para estoque/financeiro)
    INSERT INTO sale_items (sale_id, piece_id, size, qty, unit_price)
    VALUES (v_sale_id, v_item.piece_id, v_item.size, v_item.qty, v_item.unit_price);

    -- production_order vinculada ao pedido da loja
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

  -- Atualizar fulfillment_status do pedido
  UPDATE orders SET fulfillment_status = 'in_production' WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_op_from_order ON orders;
CREATE TRIGGER trg_create_op_from_order
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_sale_and_op_from_order();

-- ── 8. Updated_at automático em orders ─────────────────────────
CREATE TRIGGER touch_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── 9. Coupon uses: incrementar ao usar ─────────────────────────
CREATE OR REPLACE FUNCTION increment_coupon_uses()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.coupon_code IS NOT NULL AND NEW.payment_status = 'paid' AND OLD.payment_status <> 'paid' THEN
    UPDATE coupons SET uses = uses + 1 WHERE code = NEW.coupon_code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_coupon_uses ON orders;
CREATE TRIGGER trg_coupon_uses
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION increment_coupon_uses();
