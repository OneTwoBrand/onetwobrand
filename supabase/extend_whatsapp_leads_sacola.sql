-- Estende whatsapp_leads para suportar negociação de sacola completa (checkout)
-- além do lead por produto já existente.
-- Executar no Supabase SQL Editor.

ALTER TABLE public.whatsapp_leads
  ADD COLUMN IF NOT EXISTS tipo             text NOT NULL DEFAULT 'produto'
                           CHECK (tipo IN ('produto', 'sacola')),
  ADD COLUMN IF NOT EXISTS cliente_nome     text,
  ADD COLUMN IF NOT EXISTS cliente_email    text,
  ADD COLUMN IF NOT EXISTS cliente_telefone text,
  ADD COLUMN IF NOT EXISTS itens            jsonb,
  ADD COLUMN IF NOT EXISTS total            numeric(10,2);

-- produto_slug / produto_nome eram NOT NULL (válido para leads de produto).
-- Numa negociação de sacola não há um produto único, então tornamos nullable.
ALTER TABLE public.whatsapp_leads ALTER COLUMN produto_slug DROP NOT NULL;
ALTER TABLE public.whatsapp_leads ALTER COLUMN produto_nome DROP NOT NULL;

CREATE INDEX IF NOT EXISTS whatsapp_leads_tipo_idx ON public.whatsapp_leads (tipo);
