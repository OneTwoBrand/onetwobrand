/**
 * ONE TWO · Shop catalog data
 * Funções públicas de vitrine — sem autenticação necessária.
 * Reutiliza createClient() e hasSupabasePublicEnv() existentes.
 */
import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

// ── Tipos ────────────────────────────────────────────────────────

export type ShopCollection = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  heroUrl: string | null;
  sortOrder: number;
  pieceCount: number;
};

export type ShopProductCard = {
  pieceId: string;
  slug: string;
  name: string;
  collectionName: string | null;
  collectionSlug: string | null;
  category: string | null;
  photoUrl: string | null;
  price: number;
  availableSizes: string[];   // tamanhos com quantity > 0
  allSizes: string[];         // todos os tamanhos cadastrados
  isNew: boolean;             // featured = true
  isSoldOut: boolean;         // nenhum tamanho disponível
};

export type ShopProductDetail = ShopProductCard & {
  fabric: string | null;
  color: string | null;
  description: string | null;
  backPhotoUrl: string | null;
  detailPhotoUrl: string | null;
  stockBySizeColor: Array<{ size: string; color: string | null; quantity: number }>;
};

// ── Fallbacks ────────────────────────────────────────────────────

const fallbackCollections: ShopCollection[] = [
  { id: '1', slug: 'verao-2026',  name: 'Verão 2026',  subtitle: 'Linhos e crepes para o calor',            heroUrl: null, sortOrder: 1, pieceCount: 4 },
  { id: '2', slug: 'premium',     name: 'Premium',      subtitle: 'Peças exclusivas bordadas à mão',         heroUrl: null, sortOrder: 2, pieceCount: 3 },
  { id: '3', slug: 'bordados',    name: 'Bordados',     subtitle: 'Bordados artesanais em pequenas tiragens', heroUrl: null, sortOrder: 3, pieceCount: 2 },
];

const fallbackDetails: ShopProductDetail[] = [
  { pieceId: '1', slug: 'vestido-lis',    name: 'Vestido Lis',    collectionName: 'Verão 2026', collectionSlug: 'verao-2026', category: 'Vestido',  photoUrl: null, price: 890,  availableSizes: ['P','M','G'], allSizes: ['P','M','G'], isNew: true,  isSoldOut: false, fabric: 'Linho cru', color: 'Cru',      description: null, backPhotoUrl: null, detailPhotoUrl: null, stockBySizeColor: [] },
  { pieceId: '2', slug: 'blusa-iris',     name: 'Blusa Íris',     collectionName: 'Premium',    collectionSlug: 'premium',    category: 'Blusa',    photoUrl: null, price: 420,  availableSizes: ['P'],        allSizes: ['P','M'],    isNew: false, isSoldOut: false, fabric: 'Crepe',     color: 'Terracota', description: null, backPhotoUrl: null, detailPhotoUrl: null, stockBySizeColor: [] },
  { pieceId: '3', slug: 'conjunto-hera',  name: 'Conjunto Hera',  collectionName: 'Bordados',   collectionSlug: 'bordados',   category: 'Conjunto', photoUrl: null, price: 1240, availableSizes: [],           allSizes: ['Único'],    isNew: false, isSoldOut: true,  fabric: null,        color: null,        description: null, backPhotoUrl: null, detailPhotoUrl: null, stockBySizeColor: [] },
  { pieceId: '4', slug: 'saia-margarida', name: 'Saia Margarida', collectionName: 'Verão 2026', collectionSlug: 'verao-2026', category: 'Saia',     photoUrl: null, price: 380,  availableSizes: ['G'],        allSizes: ['P','M','G'], isNew: true, isSoldOut: false, fabric: 'Linho',     color: 'Rosé',      description: null, backPhotoUrl: null, detailPhotoUrl: null, stockBySizeColor: [] },
];

// ── Helpers ──────────────────────────────────────────────────────

function groupStockByPiece(
  rows: Array<{
    piece_id: string;
    size: string;
    color: string | null;
    quantity: number;
    pieces: {
      slug: string | null;
      name: string;
      featured: boolean;
      fabric: string | null;
      color: string | null;
      category: string | null;
      description: string | null;
      price: number;
      photo_url: string | null;
      back_photo_url: string | null;
      detail_photo_url: string | null;
      collections: { id: string; slug: string | null; name: string } | null;
    } | null;
  }>
): ShopProductDetail[] {
  const map = new Map<string, ShopProductDetail>();

  for (const row of rows) {
    const p = row.pieces;
    if (!p?.slug) continue;

    if (!map.has(row.piece_id)) {
      const col = p.collections;
      map.set(row.piece_id, {
        pieceId:        row.piece_id,
        slug:           p.slug,
        name:           p.name,
        collectionName: col?.name ?? null,
        collectionSlug: col?.slug ?? null,
        category:       p.category,
        photoUrl:       p.photo_url,
        backPhotoUrl:   p.back_photo_url,
        detailPhotoUrl: p.detail_photo_url,
        fabric:         p.fabric,
        color:          p.color,
        description:    p.description,
        price:          Number(p.price),
        availableSizes: [],
        allSizes:       [],
        isNew:          p.featured,
        isSoldOut:      false,
        stockBySizeColor: [],
      });
    }

    const entry = map.get(row.piece_id)!;
    entry.stockBySizeColor.push({ size: row.size, color: row.color, quantity: row.quantity });

    if (!entry.allSizes.includes(row.size)) entry.allSizes.push(row.size);
    if (row.quantity > 0 && !entry.availableSizes.includes(row.size)) {
      entry.availableSizes.push(row.size);
    }
  }

  for (const entry of map.values()) {
    entry.isSoldOut = entry.availableSizes.length === 0;
  }

  return Array.from(map.values());
}

// ── Queries públicas ─────────────────────────────────────────────

/** Busca todas as coleções publicadas para vitrine e nav. */
export async function getShopCollections(): Promise<{
  collections: ShopCollection[];
  source: 'supabase' | 'fallback';
  error?: string;
}> {
  if (!hasSupabasePublicEnv()) return { collections: fallbackCollections, source: 'fallback' };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('collections')
      .select('id, slug, name, subtitle, hero_url, sort_order')
      .not('published_at', 'is', null)
      .order('sort_order', { ascending: true });

    if (error) return { collections: fallbackCollections, source: 'fallback', error: error.message };

    // contar peças publicadas por coleção
    const ids = (data ?? []).map((c) => c.id);
    const { data: piecesData } = await supabase
      .from('pieces')
      .select('collection_id')
      .eq('active', true)
      .eq('published', true)
      .in('collection_id', ids);

    const countMap: Record<string, number> = {};
    for (const p of piecesData ?? []) {
      if (p.collection_id) countMap[p.collection_id] = (countMap[p.collection_id] ?? 0) + 1;
    }

    return {
      source: 'supabase',
      collections: (data ?? []).map((c) => ({
        id:         c.id,
        slug:       c.slug ?? '',
        name:       c.name,
        subtitle:   c.subtitle ?? null,
        heroUrl:    c.hero_url ?? null,
        sortOrder:  c.sort_order ?? 0,
        pieceCount: countMap[c.id] ?? 0,
      })),
    };
  } catch (e) {
    return { collections: fallbackCollections, source: 'fallback', error: String(e) };
  }
}

/** Busca todos os produtos publicados para a vitrine. */
export async function getShopProducts(opts?: {
  collectionSlug?: string;
  featuredOnly?: boolean;
}): Promise<{
  products: ShopProductDetail[];
  source: 'supabase' | 'fallback';
  error?: string;
}> {
  if (!hasSupabasePublicEnv()) return { products: fallbackDetails, source: 'fallback' };

  try {
    const supabase = await createClient();

    let pieceQuery = supabase
      .from('pieces')
      .select('id')
      .eq('active', true)
      .eq('published', true);

    if (opts?.featuredOnly) pieceQuery = pieceQuery.eq('featured', true);

    if (opts?.collectionSlug) {
      const { data: col } = await supabase
        .from('collections')
        .select('id')
        .eq('slug', opts.collectionSlug)
        .maybeSingle();
      if (!col) return { products: [], source: 'supabase' };
      pieceQuery = pieceQuery.eq('collection_id', col.id);
    }

    const { data: pieceIds, error: pieceErr } = await pieceQuery;
    if (pieceErr) return { products: fallbackDetails, source: 'fallback', error: pieceErr.message };

    const ids = (pieceIds ?? []).map((p) => p.id);
    if (ids.length === 0) return { products: [], source: 'supabase' };

    const { data, error } = await supabase
      .from('stock_items')
      .select(`
        piece_id,
        size,
        color,
        quantity,
        pieces!inner(
          slug,
          name,
          featured,
          fabric,
          color,
          category,
          description,
          price,
          photo_url,
          back_photo_url,
          detail_photo_url,
          collections(id, slug, name)
        )
      `)
      .in('piece_id', ids)
      .order('piece_id');

    if (error) return { products: fallbackDetails, source: 'fallback', error: error.message };

    return { source: 'supabase', products: groupStockByPiece(data as unknown as Parameters<typeof groupStockByPiece>[0]) };
  } catch (e) {
    return { products: fallbackDetails, source: 'fallback', error: String(e) };
  }
}

/** Busca detalhe de um produto pelo slug. */
export async function getShopProductBySlug(slug: string): Promise<{
  product: ShopProductDetail | null;
  source: 'supabase' | 'fallback';
  error?: string;
}> {
  if (!hasSupabasePublicEnv()) {
    const product = fallbackDetails.find((p) => p.slug === slug) ?? null;
    return { product: product as ShopProductDetail | null, source: 'fallback' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('stock_items')
      .select(`
        piece_id,
        size,
        color,
        quantity,
        pieces!inner(
          slug,
          name,
          featured,
          fabric,
          color,
          category,
          description,
          price,
          photo_url,
          back_photo_url,
          detail_photo_url,
          collections(id, slug, name)
        )
      `)
      .eq('pieces.slug', slug)
      .eq('pieces.active', true)
      .eq('pieces.published', true);

    if (error) return { product: null, source: 'fallback', error: error.message };

    const products = groupStockByPiece(data as unknown as Parameters<typeof groupStockByPiece>[0]);
    return { source: 'supabase', product: products[0] ?? null };
  } catch (e) {
    return { product: null, source: 'fallback', error: String(e) };
  }
}

/** Busca detalhe de uma coleção pelo slug (para página /colecoes/[slug]). */
export async function getShopCollectionBySlug(slug: string): Promise<{
  collection: ShopCollection | null;
  source: 'supabase' | 'fallback';
  error?: string;
}> {
  if (!hasSupabasePublicEnv()) {
    const collection = fallbackCollections.find((c) => c.slug === slug) ?? null;
    return { collection, source: 'fallback' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('collections')
      .select('id, slug, name, subtitle, hero_url, sort_order')
      .eq('slug', slug)
      .not('published_at', 'is', null)
      .maybeSingle();

    if (error) return { collection: null, source: 'fallback', error: error.message };
    if (!data) return { collection: null, source: 'supabase' };

    const { data: piecesData } = await supabase
      .from('pieces')
      .select('id')
      .eq('active', true)
      .eq('published', true)
      .eq('collection_id', data.id);

    return {
      source: 'supabase',
      collection: {
        id:         data.id,
        slug:       data.slug ?? slug,
        name:       data.name,
        subtitle:   data.subtitle ?? null,
        heroUrl:    data.hero_url ?? null,
        sortOrder:  data.sort_order ?? 0,
        pieceCount: piecesData?.length ?? 0,
      },
    };
  } catch (e) {
    return { collection: null, source: 'fallback', error: String(e) };
  }
}

/** Slugs de todos os produtos publicados — para generateStaticParams. */
export async function getAllProductSlugs(): Promise<string[]> {
  if (!hasSupabasePublicEnv()) return fallbackDetails.map((p) => p.slug);
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('pieces')
      .select('slug')
      .eq('active', true)
      .eq('published', true)
      .not('slug', 'is', null);
    return (data ?? []).map((p) => p.slug).filter(Boolean) as string[];
  } catch { return []; }
}

/** Slugs de todas as coleções publicadas — para generateStaticParams. */
export async function getAllCollectionSlugs(): Promise<string[]> {
  if (!hasSupabasePublicEnv()) return fallbackCollections.map((c) => c.slug);
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('collections')
      .select('slug')
      .not('published_at', 'is', null)
      .not('slug', 'is', null);
    return (data ?? []).map((c) => c.slug).filter(Boolean) as string[];
  } catch { return []; }
}
