-- Adiciona 'Ribana' em materiais e 'Branco' em cores
-- Executar no Supabase SQL Editor se workflow_config já tiver dados gravados

-- Materiais: insere Ribana após Algodão (se ainda não existir)
UPDATE public.workflow_config
SET value = (
  SELECT jsonb_agg(item ORDER BY idx)
  FROM (
    SELECT item, idx FROM jsonb_array_elements(value) WITH ORDINALITY AS t(item, idx)
    UNION ALL
    SELECT '"Ribana"'::jsonb, 4.5
    WHERE NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(value) AS e WHERE e = '"Ribana"'
    )
  ) sub
)
WHERE key = 'product_fabrics';

-- Cores: insere Branco no início (se ainda não existir)
UPDATE public.workflow_config
SET value = (
  SELECT jsonb_agg(item ORDER BY idx)
  FROM (
    SELECT item, idx FROM jsonb_array_elements(value) WITH ORDINALITY AS t(item, idx)
    UNION ALL
    SELECT '"Branco"'::jsonb, 0
    WHERE NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(value) AS e WHERE e = '"Branco"'
    )
  ) sub
)
WHERE key = 'product_colors';

-- Verificação
SELECT key, value FROM public.workflow_config WHERE key IN ('product_fabrics', 'product_colors');
