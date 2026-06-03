-- ════════════════════════════════════════════════════════════════════
-- ONE TWO — Catalog configuration seed
-- Adds default option lists for product fields: sizes, fabrics,
-- categories and colors. Stored in the existing workflow_config table.
-- ════════════════════════════════════════════════════════════════════

insert into public.workflow_config (key, value) values
  ('product_sizes',      '["PP","P","M","G","GG","Único"]'::jsonb),
  ('product_fabrics',    '["Linho","Crepe","Algodão Pima","Algodão","Seda","Musseline","Viscose","Tricoline"]'::jsonb),
  ('product_categories', '["Vestido","Blusa","Conjunto","Saia","Calça","Shorts","Macacão","Kimono"]'::jsonb),
  ('product_colors',     '["Cru","Off-white","Terracota","Rosé","Preto","Marfim","Azul","Verde","Vinho","Caramelo"]'::jsonb)
on conflict (key) do nothing;
