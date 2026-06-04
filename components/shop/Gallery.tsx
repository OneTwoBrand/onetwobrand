/**
 * ONE TWO · Gallery
 * Galeria de produto: swipe horizontal mobile com dots + thumbnails.
 * Desktop (lg+): coluna de thumbs à esquerda + imagem principal central.
 */
'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface GalleryProps {
  images: Array<{ url: string; alt?: string }>;
  productName: string;
}

export function Gallery({ images, productName }: GalleryProps) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const imgs = images.length > 0 ? images : [{ url: '', alt: productName }];

  function scrollTo(idx: number) {
    setActive(idx);
    if (scrollRef.current) {
      const w = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: idx * w, behavior: 'smooth' });
    }
  }

  function onScroll() {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
    setActive(idx);
  }

  return (
    <div className="flex flex-col lg:flex-row lg:gap-4">
      {/* ── Desktop: thumbs à esquerda ──────────────────── */}
      {imgs.length > 1 && (
        <div className="hidden lg:flex flex-col gap-2.5 w-[84px] shrink-0">
          {imgs.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              className={cn(
                'w-[84px] h-[84px] rounded-[10px] overflow-hidden border-[1.5px] transition-colors shrink-0',
                active === i ? 'border-primary' : 'border-transparent'
              )}
              aria-label={`Ver imagem ${i + 1}`}
            >
              {img.url ? (
                <Image src={img.url} alt={img.alt ?? productName} width={84} height={84} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-surface-warm" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Imagem principal ────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Scroll container mobile */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="w-full overflow-x-auto flex snap-x snap-mandatory rounded-[20px] scroll-smooth"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {imgs.map((img, i) => (
            <div key={i} className="w-full shrink-0 snap-start aspect-[4/5] relative rounded-[20px] overflow-hidden bg-surface-warm">
              {img.url ? (
                <Image
                  src={img.url}
                  alt={img.alt ?? productName}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                  priority={i === 0}
                />
              ) : (
                <div className="w-full h-full bg-surface-warm flex items-center justify-center">
                  <span className="text-[10px] text-ink-mute tracking-[0.18em] uppercase">Foto em breve</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Dots — mobile */}
        {imgs.length > 1 && (
          <div className="flex lg:hidden items-center justify-center gap-1.5">
            {imgs.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Imagem ${i + 1}`}
                className={cn(
                  'rounded-full transition-all',
                  active === i ? 'w-5 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-ink/20'
                )}
              />
            ))}
          </div>
        )}

        {/* Thumbs row — mobile */}
        {imgs.length > 1 && (
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {imgs.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                className={cn(
                  'w-14 h-14 shrink-0 rounded-[8px] overflow-hidden border-[1.5px] transition-colors',
                  active === i ? 'border-primary' : 'border-transparent'
                )}
                aria-label={`Ver imagem ${i + 1}`}
              >
                {img.url ? (
                  <Image src={img.url} alt="" width={56} height={56} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-surface-warm" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
