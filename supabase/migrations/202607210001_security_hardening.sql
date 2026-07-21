-- Security hardening: RBAC, payment idempotency and public endpoint controls.

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;

-- A direct Auth signup must never receive administrative privileges by default.
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'viewer';

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles', 'clients', 'pieces', 'stock_items', 'seamstresses',
    'production_orders', 'op_history', 'op_attachments',
    'embroidery_shipments', 'shipment_items', 'sales', 'sale_items',
    'payables', 'receivables', 'ai_usage_logs', 'collections', 'stock_movements'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "authed read" ON public.%I', table_name);
      EXECUTE format('DROP POLICY IF EXISTS "authed write" ON public.%I', table_name);
      EXECUTE format('DROP POLICY IF EXISTS "authed update" ON public.%I', table_name);
      EXECUTE format('DROP POLICY IF EXISTS "authed delete" ON public.%I', table_name);
    END IF;
  END LOOP;
END $$;

-- Profiles are readable by signed-in staff, but only administrators may mutate roles.
DROP POLICY IF EXISTS "profiles staff read" ON public.profiles;
DROP POLICY IF EXISTS "profiles admin insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles admin update" ON public.profiles;
DROP POLICY IF EXISTS "profiles admin delete" ON public.profiles;
CREATE POLICY "profiles staff read" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles admin insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.current_profile_role() = 'admin');
CREATE POLICY "profiles admin update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.current_profile_role() = 'admin')
  WITH CHECK (public.current_profile_role() = 'admin');
CREATE POLICY "profiles admin delete" ON public.profiles
  FOR DELETE TO authenticated USING (public.current_profile_role() = 'admin');

-- All authenticated roles may read operational data. Viewer remains read-only.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'clients', 'pieces', 'stock_items', 'seamstresses', 'production_orders',
    'op_history', 'op_attachments', 'embroidery_shipments', 'shipment_items',
    'sales', 'sale_items', 'payables', 'receivables', 'ai_usage_logs',
    'collections', 'stock_movements'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "staff read" ON public.%I', table_name);
      EXECUTE format(
        'CREATE POLICY "staff read" ON public.%I FOR SELECT TO authenticated USING (true)',
        table_name
      );
    END IF;
  END LOOP;
END $$;

-- Admin and atelier operate the core platform.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'clients', 'pieces', 'stock_items', 'seamstresses', 'production_orders',
    'op_history', 'op_attachments', 'embroidery_shipments', 'shipment_items',
    'sales', 'sale_items', 'payables', 'receivables', 'collections', 'stock_movements'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "operators insert" ON public.%I', table_name);
      EXECUTE format('DROP POLICY IF EXISTS "operators update" ON public.%I', table_name);
      EXECUTE format('DROP POLICY IF EXISTS "operators delete" ON public.%I', table_name);
      EXECUTE format(
        'CREATE POLICY "operators insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.current_profile_role() IN (''admin'', ''atelier''))',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY "operators update" ON public.%I FOR UPDATE TO authenticated USING (public.current_profile_role() IN (''admin'', ''atelier'')) WITH CHECK (public.current_profile_role() IN (''admin'', ''atelier''))',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY "operators delete" ON public.%I FOR DELETE TO authenticated USING (public.current_profile_role() IN (''admin'', ''atelier''))',
        table_name
      );
    END IF;
  END LOOP;
END $$;

-- Sales users may handle customers and negotiations, without broader operational writes.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['clients', 'sales', 'sale_items', 'receivables'] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "sales role insert" ON public.%I', table_name);
      EXECUTE format('DROP POLICY IF EXISTS "sales role update" ON public.%I', table_name);
      EXECUTE format(
        'CREATE POLICY "sales role insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.current_profile_role() = ''vendedora'')',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY "sales role update" ON public.%I FOR UPDATE TO authenticated USING (public.current_profile_role() = ''vendedora'') WITH CHECK (public.current_profile_role() = ''vendedora'')',
        table_name
      );
    END IF;
  END LOOP;
END $$;

-- Any signed-in user may append AI audit logs, but cannot alter history.
DROP POLICY IF EXISTS "ai logs authenticated insert" ON public.ai_usage_logs;
CREATE POLICY "ai logs authenticated insert" ON public.ai_usage_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Service-role operations bypass RLS; permissive public policies are unnecessary.
DROP POLICY IF EXISTS "orders service insert" ON public.orders;
DROP POLICY IF EXISTS "orders service update" ON public.orders;
DROP POLICY IF EXISTS "order_items service insert" ON public.order_items;
DO $$
BEGIN
  IF to_regclass('public.whatsapp_leads') IS NOT NULL THEN
    DROP POLICY IF EXISTS "whatsapp_leads_insert_public" ON public.whatsapp_leads;
  END IF;
END $$;

-- The status helper accepts an arbitrary order UUID, so only trusted server code may call it.
REVOKE ALL ON FUNCTION public.shop_order_progress(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shop_order_progress(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.shop_order_progress(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.shop_order_progress(uuid) TO service_role;

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  provider text NOT NULL,
  event_id text NOT NULL,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'failed')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  PRIMARY KEY (provider, event_id)
);
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.shop_email_queue
  ADD COLUMN IF NOT EXISTS processing_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_email_queue_claimable
  ON public.shop_email_queue (queued_at)
  WHERE sent_at IS NULL AND error IS NULL AND processing_at IS NULL;

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  key_hash text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count > 0)
);
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed boolean;
BEGIN
  IF p_limit < 1 OR p_window_seconds < 1 OR length(p_key_hash) < 16 THEN
    RETURN false;
  END IF;

  INSERT INTO public.api_rate_limits AS limits (key_hash, window_started_at, request_count)
  VALUES (p_key_hash, now(), 1)
  ON CONFLICT (key_hash) DO UPDATE
    SET window_started_at = CASE
          WHEN limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
          THEN now() ELSE limits.window_started_at END,
        request_count = CASE
          WHEN limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
          THEN 1 ELSE limits.request_count + 1 END
  RETURNING request_count <= p_limit INTO allowed;

  RETURN allowed;
END;
$$;

REVOKE ALL ON FUNCTION public.check_api_rate_limit(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_api_rate_limit(text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.check_api_rate_limit(text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_api_rate_limit(text, integer, integer) TO service_role;

DROP POLICY IF EXISTS "product images authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "product images authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "product images authenticated delete" ON storage.objects;

CREATE POLICY "product images role insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (
      public.current_profile_role() = 'admin'
      OR (public.current_profile_role() = 'atelier' AND name LIKE 'products/%')
    )
  );
CREATE POLICY "product images role update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (
      public.current_profile_role() = 'admin'
      OR (public.current_profile_role() = 'atelier' AND name LIKE 'products/%')
    )
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (
      public.current_profile_role() = 'admin'
      OR (public.current_profile_role() = 'atelier' AND name LIKE 'products/%')
    )
  );
CREATE POLICY "product images role delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (
      public.current_profile_role() = 'admin'
      OR (public.current_profile_role() = 'atelier' AND name LIKE 'products/%')
    )
  );
