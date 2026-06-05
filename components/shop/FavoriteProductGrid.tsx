'use client';

/**
 * Wrapper Client Component para grades de produto com favoritos.
 * Lê o store de favoritos e passa isFavorited/onToggleFavorite para cada card.
 */
import { useFavoritesStore, type FavoriteItem } from '@/lib/shop/favorites-store';
import { ProductCard } from './ProductCard';
import type { ShopProductCard } from '@/lib/shop/catalog';

export function FavoriteProductGrid({
  products,
  cardMotion = false,
}: {
  products: ShopProductCard[];
  cardMotion?: boolean;
}) {
  const { isFavorited, toggleFavorite } = useFavoritesStore();

  function toFavoriteItem(p: ShopProductCard): FavoriteItem {
    return {
      pieceId:        p.pieceId,
      slug:           p.slug,
      name:           p.name,
      photoUrl:       p.photoUrl,
      price:          p.price,
      collectionName: p.collectionName,
    };
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
      {products.map((product) => (
        <ProductCard
          key={product.pieceId}
          product={product}
          isFavorited={isFavorited(product.pieceId)}
          onToggleFavorite={() => toggleFavorite(toFavoriteItem(product))}
          cardMotion={cardMotion}
        />
      ))}
    </div>
  );
}
