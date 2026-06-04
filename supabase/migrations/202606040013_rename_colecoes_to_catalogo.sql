-- Atualiza nav_permissions: substitui '/colecoes' por '/catalogo' em todos os perfis
-- Necessário após renomear a rota administrativa de /colecoes para /catalogo

UPDATE profiles
SET nav_permissions = (
  SELECT jsonb_agg(
    CASE WHEN elem::text = '"/colecoes"' THEN '"/catalogo"'::jsonb ELSE elem END
  )
  FROM jsonb_array_elements(nav_permissions) AS elem
)
WHERE nav_permissions IS NOT NULL
  AND nav_permissions @> '["/colecoes"]';
