import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export type CollectionOption = {
  id: string;
  name: string;
  category?: string | null;
  featured?: boolean;
  featuredOrder?: number;
  slug?: string | null;
  publishedAt?: string | null;
};

export type CatalogStockItem = {
  id: string;
  pieceId: string;
  slug?: string | null;
  name: string;
  collectionId?: string | null;
  collectionName?: string | null;
  category?: string | null;
  description?: string | null;
  fabric?: string | null;
  color?: string | null;
  photoUrl?: string | null;
  backPhotoUrl?: string | null;
  detailPhotoUrl?: string | null;
  size: string;
  quantity: number;
  lowThreshold: number;
  costPrice: number;
  price: number;
  published?: boolean;
  featured?: boolean;
};

const fallbackCollections: CollectionOption[] = [
  { id: 'premium', name: 'Premium', category: 'Bordados', featured: true, featuredOrder: 1, slug: 'premium', publishedAt: new Date().toISOString() },
  { id: 'verao', name: 'Verão 2026', category: 'Casual', featured: false, featuredOrder: 2, slug: 'verao-2026', publishedAt: new Date().toISOString() },
  { id: 'bordados', name: 'Bordados', category: 'Artesanal', featured: false, featuredOrder: 3, slug: 'bordados', publishedAt: new Date().toISOString() },
];

const fallbackProducts: CatalogStockItem[] = [
  { id: 'vestido-lis', pieceId: 'vestido-lis', name: 'Vestido Lis', collectionName: 'Verão 2026', category: 'Vestido', fabric: 'Linho cru', color: 'Cru', size: 'M', quantity: 8, lowThreshold: 3, costPrice: 320, price: 890 },
  { id: 'blusa-iris', pieceId: 'blusa-iris', name: 'Blusa Íris', collectionName: 'Premium', category: 'Blusa', fabric: 'Crepe', color: 'Terracota', size: 'P', quantity: 5, lowThreshold: 3, costPrice: 160, price: 420 },
  { id: 'conjunto-hera', pieceId: 'conjunto-hera', name: 'Conjunto Hera', collectionName: 'Bordados', category: 'Conjunto', fabric: 'Algodão Pima', color: 'Off-white', size: 'Único', quantity: 3, lowThreshold: 3, costPrice: 520, price: 1240 },
  { id: 'saia-margarida', pieceId: 'saia-margarida', name: 'Saia Margarida', collectionName: 'Casual', category: 'Saia', fabric: 'Linho', color: 'Rosé', size: 'G', quantity: 12, lowThreshold: 3, costPrice: 120, price: 380 },
];

type PieceRow = {
  id?: string;
  slug: string | null;
  name: string;
  collection_id: string | null;
  fabric: string | null;
  color: string | null;
  category: string | null;
  description: string | null;
  cost_price: number;
  price: number;
  photo_url: string | null;
  back_photo_url: string | null;
  detail_photo_url: string | null;
  published: boolean;
  featured: boolean;
  collections: { id: string; name: string } | { id: string; name: string }[] | null;
};

type StockRow = {
  id: string;
  piece_id: string;
  size: string;
  color: string | null;
  quantity: number;
  low_threshold: number;
  pieces: PieceRow | PieceRow[] | null;
};

function firstRelated<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function mapStockRow(item: StockRow): CatalogStockItem {
  const piece = firstRelated(item.pieces);
  const collection = firstRelated(piece?.collections ?? null);

  return {
    id: item.id,
    pieceId: item.piece_id,
    slug: piece?.slug,
    name: piece?.name ?? 'Produto',
    collectionId: piece?.collection_id,
    collectionName: collection?.name,
    category: piece?.category,
    description: piece?.description,
    fabric: piece?.fabric,
    color: item.color ?? piece?.color,
    photoUrl: piece?.photo_url,
    backPhotoUrl: piece?.back_photo_url,
    detailPhotoUrl: piece?.detail_photo_url,
    size: item.size,
    quantity: item.quantity,
    lowThreshold: item.low_threshold,
    costPrice: Number(piece?.cost_price ?? 0),
    price: Number(piece?.price ?? 0),
    published: Boolean(piece?.published),
    featured: Boolean(piece?.featured),
  };
}

export async function getCollections(): Promise<{ collections: CollectionOption[]; source: 'supabase' | 'fallback'; error?: string }> {
  if (!hasSupabasePublicEnv()) return { collections: fallbackCollections, source: 'fallback' };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, category, slug, published_at, featured, featured_order')
      .eq('active', true)
      .order('featured_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      const legacy = await supabase
        .from('collections')
        .select('id, name, category, slug, published_at')
        .eq('active', true)
        .order('name', { ascending: true });

      if (legacy.error) return { collections: fallbackCollections, source: 'fallback', error: error.message };

      return {
        source: 'supabase',
        error: error.message,
        collections: (legacy.data ?? []).map((collection) => ({
          id: collection.id,
          name: collection.name,
          category: collection.category,
          slug: collection.slug,
          publishedAt: collection.published_at,
          featured: false,
          featuredOrder: 0,
        })),
      };
    }

    return {
      source: 'supabase',
      collections: (data ?? []).map((collection) => ({
        id: collection.id,
        name: collection.name,
        category: collection.category,
        slug: collection.slug,
        publishedAt: collection.published_at,
        featured: Boolean(collection.featured),
        featuredOrder: Number(collection.featured_order ?? 0),
      })),
    };
  } catch (error) {
    return { collections: fallbackCollections, source: 'fallback', error: error instanceof Error ? error.message : 'Erro ao buscar coleções.' };
  }
}

export type CollectionDetail = {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  heroUrl?: string | null;
  slug?: string | null;
  publishedAt?: string | null;
  featured?: boolean;
  featuredOrder?: number;
};

export async function getCollectionById(id: string): Promise<{ collection: CollectionDetail | null }> {
  if (!hasSupabasePublicEnv()) return { collection: null };
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('collections')
      .select('id, name, category, description, hero_url, slug, published_at, featured, featured_order')
      .eq('id', id)
      .maybeSingle();
    if (!data) return { collection: null };
    return {
      collection: {
        id: data.id,
        name: data.name,
        category: data.category,
        description: data.description,
        heroUrl: data.hero_url,
        slug: data.slug,
        publishedAt: data.published_at,
        featured: Boolean(data.featured),
        featuredOrder: Number(data.featured_order ?? 0),
      },
    };
  } catch {
    return { collection: null };
  }
}

export async function getCatalogStock(): Promise<{ products: CatalogStockItem[]; source: 'supabase' | 'fallback'; error?: string }> {
  if (!hasSupabasePublicEnv()) return { products: fallbackProducts, source: 'fallback' };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('stock_items')
      .select(`
        id,
        piece_id,
        size,
        color,
        quantity,
        low_threshold,
        pieces(
          id,
          slug,
          name,
          collection_id,
          fabric,
          color,
          category,
          description,
          cost_price,
          price,
          photo_url,
          back_photo_url,
          detail_photo_url,
          published,
          featured,
          collections(id, name)
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) return { products: fallbackProducts, source: 'fallback', error: error.message };

    return {
      source: 'supabase',
      products: (data as StockRow[]).map(mapStockRow),
    };
  } catch (error) {
    return { products: fallbackProducts, source: 'fallback', error: error instanceof Error ? error.message : 'Erro ao buscar produtos.' };
  }
}

export async function getCatalogStockItem(stockItemId: string): Promise<{
  product: CatalogStockItem | null;
  source: 'supabase' | 'fallback';
  error?: string;
}> {
  if (!hasSupabasePublicEnv()) {
    return {
      source: 'fallback',
      product: fallbackProducts.find((product) => product.id === stockItemId) ?? null,
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('stock_items')
      .select(`
        id,
        piece_id,
        size,
        color,
        quantity,
        low_threshold,
        pieces(
          id,
          slug,
          name,
          collection_id,
          fabric,
          color,
          category,
          description,
          cost_price,
          price,
          photo_url,
          back_photo_url,
          detail_photo_url,
          published,
          featured,
          collections(id, name)
        )
      `)
      .eq('id', stockItemId)
      .maybeSingle();

    if (error) return { product: null, source: 'supabase', error: error.message };
    if (!data) return { product: null, source: 'supabase' };

    return { product: mapStockRow(data as StockRow), source: 'supabase' };
  } catch (error) {
    return { product: null, source: 'supabase', error: error instanceof Error ? error.message : 'Erro ao buscar produto.' };
  }
}
