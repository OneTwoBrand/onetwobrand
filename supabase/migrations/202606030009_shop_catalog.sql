-- ================================================================
-- Sprint L1 · Shop catalog
-- Adiciona campos públicos em pieces e collections,
-- cria tabela favorites e abre RLS para leitura pública.
-- ================================================================

-- ── 1. Campos públicos em pieces ────────────────────────────────
ALTER TABLE pieces
  ADD COLUMN IF NOT EXISTS slug        TEXT,
  ADD COLUMN IF NOT EXISTS published   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured    BOOLEAN NOT NULL DEFAULT false;

-- índice único para slug (apenas quando preenchido)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pieces_slug
  ON pieces (slug) WHERE slug IS NOT NULL;

-- ── 2. Campos públicos em collections ───────────────────────────
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS slug         TEXT,
  ADD COLUMN IF NOT EXISTS hero_url     TEXT,
  ADD COLUMN IF NOT EXISTS subtitle     TEXT,
  ADD COLUMN IF NOT EXISTS sort_order   INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_slug
  ON collections (slug) WHERE slug IS NOT NULL;

-- ── 3. Tabela favorites ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  piece_id    UUID NOT NULL REFERENCES pieces(id)     ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, piece_id)
);

-- ── 4. RLS pública — leitura de catálogo ────────────────────────

-- pieces: qualquer pessoa pode ler as publicadas e ativas
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop public read pieces" ON pieces;
CREATE POLICY "shop public read pieces" ON pieces
  FOR SELECT USING (active = true AND published = true);

-- stock_items: leitura pública (quantidade visível na loja)
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop public read stock" ON stock_items;
CREATE POLICY "shop public read stock" ON stock_items
  FOR SELECT USING (true);

-- collections: leitura pública das publicadas
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop public read collections" ON collections;
CREATE POLICY "shop public read collections" ON collections
  FOR SELECT USING (published_at IS NOT NULL);

-- favorites: usuário autenticado gerencia os próprios
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites owner read"   ON favorites;
DROP POLICY IF EXISTS "favorites owner insert" ON favorites;
DROP POLICY IF EXISTS "favorites owner delete" ON favorites;

CREATE POLICY "favorites owner read" ON favorites
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "favorites owner insert" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "favorites owner delete" ON favorites
  FOR DELETE USING (auth.uid() = customer_id);

-- ── 5. Seed: slug e published para dados de demonstração ────────
-- Apenas quando os registros de seed existem (id fixo do 0002_seed.sql)
UPDATE pieces SET
  slug      = 'vestido-lis',
  published = true,
  featured  = true
WHERE name = 'Vestido Lis';

UPDATE pieces SET
  slug      = 'blusa-iris',
  published = true
WHERE name = 'Blusa Íris';

UPDATE pieces SET
  slug      = 'conjunto-hera',
  published = true
WHERE name = 'Conjunto Hera';

UPDATE pieces SET
  slug      = 'saia-margarida',
  published = true,
  featured  = true
WHERE name = 'Saia Margarida';

UPDATE collections SET
  slug         = 'premium',
  sort_order   = 1,
  subtitle     = 'Peças exclusivas bordadas à mão',
  published_at = now()
WHERE name = 'Premium';

UPDATE collections SET
  slug         = 'verao-2026',
  sort_order   = 2,
  subtitle     = 'Linhos e crepes para o calor',
  published_at = now()
WHERE name = 'Verão 2026';

UPDATE collections SET
  slug         = 'bordados',
  sort_order   = 3,
  subtitle     = 'Bordados artesanais em pequenas tiragens',
  published_at = now()
WHERE name = 'Bordados';
