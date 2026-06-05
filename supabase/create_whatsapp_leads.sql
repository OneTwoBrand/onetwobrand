-- Tabela de leads de negociação via WhatsApp
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.whatsapp_leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_slug    text NOT NULL,
  produto_nome    text NOT NULL,
  tamanho         text,
  url             text,
  status          text NOT NULL DEFAULT 'novo'
                  CHECK (status IN ('novo', 'em_atendimento', 'fechado', 'perdido')),
  notas           text,
  atendido_por    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS whatsapp_leads_status_idx     ON public.whatsapp_leads (status);
CREATE INDEX IF NOT EXISTS whatsapp_leads_created_at_idx ON public.whatsapp_leads (created_at DESC);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS whatsapp_leads_updated_at ON public.whatsapp_leads;
CREATE TRIGGER whatsapp_leads_updated_at
  BEFORE UPDATE ON public.whatsapp_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: inserção pública (loja), leitura/update apenas para admin e vendedora
ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_leads_insert_public" ON public.whatsapp_leads;
CREATE POLICY "whatsapp_leads_insert_public"
  ON public.whatsapp_leads FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "whatsapp_leads_read_staff" ON public.whatsapp_leads;
CREATE POLICY "whatsapp_leads_read_staff"
  ON public.whatsapp_leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'vendedora', 'atelier')
    )
  );

DROP POLICY IF EXISTS "whatsapp_leads_update_staff" ON public.whatsapp_leads;
CREATE POLICY "whatsapp_leads_update_staff"
  ON public.whatsapp_leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'vendedora', 'atelier')
    )
  );
