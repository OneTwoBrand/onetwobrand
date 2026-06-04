/**
 * ONE TWO · AddToCartButton
 * Seleção de tamanho + sticky dock com CTA.
 * Adiciona ao CartStore (Zustand) e exibe toast de confirmação.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/shop/cart-store';
import { useFavoritesStore } from '@/lib/shop/favorites-store';
import type { ShopProductDetail } from '@/lib/shop/catalog';

interface AddToCartButtonProps {
  product: ShopProductDetail;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [added, setAdded]       = useState(false);
  const router   = useRouter();
  const addItem  = useCartStore((s) => s.addItem);
  const { isFavorited, toggleFavorite } = useFavoritesStore();
  const favorited = isFavorited(product.pieceId);

  const { allSizes, availableSizes, isSoldOut } = product;

  function handleAdd() {
    if (!selected || isSoldOut) return;
    addItem({
      pieceId:  product.pieceId,
      slug:     product.slug,
      name:     product.name,
      size:     selected,
      color:    product.color,
      photoUrl: product.photoUrl,
      price:    product.price,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <>
      {/* Chips de tamanho */}
      <div className="flex flex-wrap gap-2">
        {allSizes.map((size) => {
          const available = availableSizes.includes(size);
          const active    = selected === size;
          return (
            <button
              key={size}
              type="button"
              disabled={!available}
              onClick={() => setSelected(active ? null : size)}
              className={cn(
                'h-10 min-w-[44px] px-3 rounded-[10px] border text-[12px] font-medium tracking-[0.12em] uppercase transition-colors',
                active
                  ? 'bg-ink text-paper border-ink'
                  : available
                  ? 'bg-transparent text-ink border-line hover:border-ink'
                  : 'bg-transparent text-ink-mute border-line line-through opacity-50 cursor-not-allowed'
              )}
            >
              {size}
            </button>
          );
        })}
      </div>

      {/* Sticky dock */}
      <div className="sticky bottom-0 mt-6 -mx-5 px-5 py-3 bg-bg/95 backdrop-blur-sm border-t border-line lg:static lg:mx-0 lg:px-0 lg:border-0 lg:bg-transparent lg:backdrop-blur-none"
           style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2.5 items-stretch">
          <button
            type="button"
            aria-label={favorited ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            onClick={() => toggleFavorite({
              pieceId:        product.pieceId,
              slug:           product.slug,
              name:           product.name,
              photoUrl:       product.photoUrl,
              price:          product.price,
              collectionName: product.collectionName,
            })}
            className={cn(
              'w-[52px] h-[52px] shrink-0 rounded-full border flex items-center justify-center transition-colors',
              favorited
                ? 'bg-primary border-primary text-paper'
                : 'border-line text-ink hover:bg-ink/5'
            )}
          >
            <Heart size={20} strokeWidth={1.5} fill={favorited ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            disabled={isSoldOut || !selected}
            onClick={added ? () => router.push('/carrinho') : handleAdd}
            className={cn(
              'flex-1 h-[52px] rounded-full flex items-center justify-center gap-2.5 text-[12px] font-medium tracking-[0.20em] uppercase transition-colors',
              isSoldOut
                ? 'bg-surface text-ink-mute cursor-not-allowed'
                : added
                ? 'bg-success text-paper'
                : selected
                ? 'bg-primary text-paper hover:bg-primary-hover'
                : 'bg-ink/10 text-ink cursor-not-allowed'
            )}
          >
            {added ? <Check size={16} /> : <ShoppingBag size={16} />}
            <span>
              {isSoldOut ? 'Esgotada'
                : added   ? 'Adicionado — ver sacola'
                : selected ? 'Adicionar à sacola'
                : 'Selecione um tamanho'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
