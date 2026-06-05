/**
 * ONE TWO · ProductCard
 * Card de produto para grid 2-col (mobile) / 4-col (desktop).
 * Foto 4:5, badge top-left, estrela favorito top-right.
 * Esgotado: opacity 0.55 + tag central.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { cn, brl } from '@/lib/utils';
import type { ShopProductCard } from '@/lib/shop/catalog';

interface ProductCardProps {
  product: ShopProductCard;
  isFavorited?: boolean;
  onToggleFavorite?: (pieceId: string) => void;
  cardMotion?: boolean;
}

export function ProductCard({ product, isFavorited = false, onToggleFavorite, cardMotion = false }: ProductCardProps) {
  const { slug, name, collectionName, photoUrl, price, availableSizes, allSizes, isNew, isSoldOut } = product;

  return (
    <div className="flex flex-col">
      {/* Foto 4:5 */}
      <div className="relative w-full aspect-[4/5] rounded-[14px] overflow-hidden bg-surface">
        <Link href={`/produto/${slug}`} className={cn('group block w-full h-full', isSoldOut && 'opacity-55')}>
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={name}
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              className={cn(
                'object-cover',
                cardMotion && 'motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out group-hover:scale-[1.035] group-focus-visible:scale-[1.035]'
              )}
            />
          ) : (
            <div className="w-full h-full bg-surface-warm flex items-center justify-center">
              <span className="text-[10px] text-ink-mute tracking-[0.18em] uppercase">Foto em breve</span>
            </div>
          )}

          {/* Tag esgotada */}
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-medium tracking-[0.20em] uppercase text-ink bg-paper/80 px-3 py-1.5 rounded-full">
                Esgotada
              </span>
            </div>
          )}
        </Link>

        {/* Badge top-left */}
        {isNew && !isSoldOut && (
          <span className="absolute top-2.5 left-2.5 text-[9px] font-medium tracking-[0.20em] uppercase text-paper bg-primary px-2 py-1 rounded-full">
            Novo
          </span>
        )}

        {/* Estrela favorito top-right */}
        <button
          type="button"
          aria-label={isFavorited ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          onClick={() => onToggleFavorite?.(product.pieceId)}
          className={cn(
            'absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors',
            isFavorited ? 'bg-primary text-paper' : 'bg-paper/90 text-ink-mute hover:text-primary'
          )}
        >
          <Heart size={14} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Info */}
      <Link href={`/produto/${slug}`} className="mt-2.5 flex flex-col gap-0.5">
        {collectionName && (
          <span className="text-[9px] font-medium tracking-[0.20em] uppercase text-ink-mute">
            {collectionName}
          </span>
        )}
        <span className="font-serif text-[15px] text-ink leading-snug">{name}</span>
        <div className="flex items-baseline justify-between mt-0.5">
          <span className="font-serif text-[15px] text-ink">{brl(price)}</span>
          {allSizes.length > 0 && (
            <span className="text-[9px] font-medium tracking-[0.16em] uppercase text-ink-mute">
              {availableSizes.length > 0 ? availableSizes.slice(0, 3).join(' · ') : '—'}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

/** Skeleton para loading state */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="w-full aspect-[4/5] rounded-[14px] bg-surface" />
      <div className="mt-2.5 flex flex-col gap-1.5">
        <div className="h-2 w-16 rounded bg-surface" />
        <div className="h-4 w-3/4 rounded bg-surface" />
        <div className="h-3 w-1/2 rounded bg-surface" />
      </div>
    </div>
  );
}
