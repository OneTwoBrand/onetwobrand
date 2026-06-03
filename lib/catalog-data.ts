import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export type CollectionOption = {
  id: string;
  name: string;
  category?: string | null;
};

export type CatalogStockItem = {
  id: string;
  pieceId: string;
  name: string;
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
};

const fallbackCollections: CollectionOption[] = [
  { id: 'premium', name: 'Premium', category: 'Bordados' },
  { id: 'verao', name: 'Verão 2026', category: 'Casual' },
  { id: 'bordados', name: 'Bordados', category: 'Artesanal' },
];

const fallbackProducts: CatalogStockItem[] = [
  { id: 'vestido-lis', pieceId: 'vestido-lis', name: 'Vestido Lis', collectionName: 'Verão 2026', category: 'Vestido', fabric: 'Linho cru', color: 'Cru', size: 'M', quantity: 8, lowThreshold: 3, costPrice: 320, price: 890 },
  { id: 'blusa-iris', pieceId: 'blusa-iris', name: 'Blusa Íris', collectionName: 'Premium', category: 'Blusa', fabric: 'Crepe', color: 'Terracota', size: 'P', quantity: 5, lowThreshold: 3, costPrice: 160, price: 420 },
  { id: 'conjunto-hera', pieceId: 'conjunto-hera', name: 'Conjunto Hera', collectionName: 'Bordados', category: 'Conjunto', fabric: 'Algodão Pima', color: 'Off-white', size: 'Único', quantity: 3, lowThreshold: 3, costPrice: 520, price: 1240 },
  { id: 'saia-margarida', pieceId: 'saia-margarida', name: 'Saia Margarida', collectionName: 'Casual', category: 'Saia', fabric: 'Linho', color: 'Rosé', size: 'G', quantity: 12, lowThreshold: 3, costPrice: 120, price: 380 },
];

type StockRow = {
  id: string;
  piece_id: string;
  size: string;
  color: string | null;
  quantity: number;
  low_threshold: number;
  pieces:
    | {
        name: string;
        fabric: string | null;
        color: string | null;
        category: string | null;
        description: string | null;
        cost_price: number;
        price: number;
        photo_url: string | null;
        back_photo_url: string | null;
        detail_photo_url: string | null;
        collections: { name: string } | { name: string }[] | null;
      }
    | {
        name: string;
        fabric: string | null;
        color: string | null;
        category: string | null;
        description: string | null;
        cost_price: number;
        price: number;
        photo_url: string | null;
        back_photo_url: string | null;
        detail_photo_url: string | null;
        collections: { name: string } | { name: string }[] | null;
      }[]
    | null;
};

function firstRelated<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function getCollections(): Promise<{ collections: CollectionOption[]; source: 'supabase' | 'fallback'; error?: string }> {
  if (!hasSupabasePublicEnv()) return { collections: fallbackCollections, source: 'fallback' };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, category')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) return { collections: fallbackCollections, source: 'fallback', error: error.message };

    return { source: 'supabase', collections: data ?? [] };
  } catch (error) {
    return { collections: fallbackCollections, source: 'fallback', error: error instanceof Error ? error.message : 'Erro ao buscar coleções.' };
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
          name,
          fabric,
          color,
          category,
          description,
          cost_price,
          price,
          photo_url,
          back_photo_url,
          detail_photo_url,
          collections(name)
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) return { products: fallbackProducts, source: 'fallback', error: error.message };

    return {
      source: 'supabase',
      products: (data as StockRow[]).map((item) => {
        const piece = firstRelated(item.pieces);
        const collection = firstRelated(piece?.collections ?? null);
        return {
          id: item.id,
          pieceId: item.piece_id,
          name: piece?.name ?? 'Produto',
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
        };
      }),
    };
  } catch (error) {
    return { products: fallbackProducts, source: 'fallback', error: error instanceof Error ? error.message : 'Erro ao buscar produtos.' };
  }
}
