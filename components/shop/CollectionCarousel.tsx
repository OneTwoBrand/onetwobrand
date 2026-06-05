/**
 * ONE TWO · CollectionCarousel
 * Carrossel horizontal de coleções — scroll nativo snap.
 * Mobile: chips 110px. Desktop: chips maiores em grid.
 */
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ShopCollection } from '@/lib/shop/catalog';

interface CollectionCarouselProps {
  collections: ShopCollection[];
  activeSlug?: string;
  cardMotion?: boolean;
}

export function CollectionCarousel({ collections, activeSlug, cardMotion = false }: CollectionCarouselProps) {
  return (
    <div
      className="flex gap-2.5 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
    >
      {collections.map((col, i) => {
        const isActive = col.slug === activeSlug;
        const isFirst = i === 0;
        return (
          <Link
            key={col.id}
            href={`/loja/colecoes/${col.slug}`}
            style={{ scrollSnapAlign: 'start', minWidth: 110 }}
            className={cn(
              'group flex flex-col items-start justify-end shrink-0 rounded-[14px] overflow-hidden h-[110px] w-[110px] p-3 relative transition-colors',
              isActive ? 'bg-primary' : isFirst ? 'bg-primary' : 'bg-surface'
            )}
          >
            {col.heroUrl && (
              <Image
                src={col.heroUrl}
                alt={col.name}
                fill
                className={cn(
                  'object-cover opacity-40',
                  cardMotion && 'motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out group-hover:scale-[1.04] group-focus-visible:scale-[1.04]'
                )}
                sizes="110px"
              />
            )}
            <div className="relative z-10">
              <div className={cn(
                'text-[9px] font-medium tracking-[0.18em] uppercase',
                isActive || isFirst ? 'text-paper/70' : 'text-ink-mute'
              )}>
                {col.pieceCount} peças
              </div>
              <div className={cn(
                'font-serif text-[14px] leading-tight mt-0.5',
                isActive || isFirst ? 'text-paper' : 'text-ink'
              )}>
                {col.name}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/** Skeleton do carrossel */
export function CollectionCarouselSkeleton() {
  return (
    <div className="flex gap-2.5 overflow-x-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="w-[110px] h-[110px] shrink-0 rounded-[14px] bg-surface animate-pulse" />
      ))}
    </div>
  );
}
