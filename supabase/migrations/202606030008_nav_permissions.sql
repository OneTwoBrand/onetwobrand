-- ════════════════════════════════════════════════════════════════════
-- ONE TWO — Per-user navigation permissions
-- Adds nav_permissions (jsonb array of hrefs) to profiles.
-- Admin users always have full access (column is ignored for them).
-- Non-admins see only the hrefs listed here.
-- Default = all non-admin modules enabled.
-- ════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists nav_permissions jsonb;

-- Backfill existing non-admin profiles with full default permissions
update public.profiles
set nav_permissions = '[
  "/",
  "/producao",
  "/bordagem",
  "/costureiras",
  "/estoque",
  "/colecoes",
  "/clientes",
  "/vendas",
  "/financeiro",
  "/relatorios",
  "/assistant",
  "/mais"
]'::jsonb
where role <> 'admin' and nav_permissions is null;
