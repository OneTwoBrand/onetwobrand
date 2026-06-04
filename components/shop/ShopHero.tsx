'use client';

/**
 * ONE TWO · ShopHero
 * Slideshow full-screen estilo Zara com efeito Ken Burns (zoom lento) e
 * crossfade entre slides. Cada slide tem eyebrow, título e CTA próprios.
 *
 * Quando apenas 1 slide é passado, exibe estático sem controles.
 * Quando nenhum slide configurado, cai no fallback colorido (coleção em destaque).
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HeroSlide } from '@/app/(app)/mais/shop-config-actions';

interface ShopHeroProps {
  slides: HeroSlide[];
  interval?: number; // seconds
  fallbackCollectionName?: string;
  fallbackCollectionSubtitle?: string;
  fallbackCollectionSlug?: string;
}

export function ShopHero({
  slides,
  interval = 7,
  fallbackCollectionName,
  fallbackCollectionSubtitle,
  fallbackCollectionSlug,
}: ShopHeroProps) {

  // ── Fallback: card colorido quando não há slides configurados ─────────────
  if (slides.length === 0) {
    if (!fallbackCollectionName) return null;
    return (
      <Link
        href={fallbackCollectionSlug ? `/loja/colecoes/${fallbackCollectionSlug}` : '/loja'}
        className="block rounded-[22px] bg-primary px-6 py-8 relative overflow-hidden"
      >
        <svg aria-hidden className="absolute bottom-[-20%] right-[-8%] w-[55%] opacity-[0.14] pointer-events-none" viewBox="0 0 200 200" fill="none">
          <rect x="100" y="4" width="136" height="136" rx="4" transform="rotate(45 100 4)" stroke="#FBF6E4" strokeWidth="1.5" />
        </svg>
        <div className="relative z-10 flex flex-col gap-2 max-w-[280px]">
          <span className="text-[9px] font-medium tracking-[0.24em] uppercase text-paper/70">Coleção em destaque</span>
          <h1 className="font-serif text-[32px] leading-[1.05] font-light text-paper">{fallbackCollectionName}</h1>
          {fallbackCollectionSubtitle && (
            <p className="text-[12px] text-paper/75 leading-[1.55]">{fallbackCollectionSubtitle}</p>
          )}
          <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.16em] uppercase text-paper underline underline-offset-4">
            Ver coleção <ArrowRight size={13} />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <HeroSlideshow
      slides={slides}
      interval={interval}
    />
  );
}

// ── Slideshow interno (separado para isolar os hooks) ─────────────────────────
function HeroSlideshow({ slides, interval }: { slides: HeroSlide[]; interval: number }) {
  const [active, setActive]   = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ms = Math.max(3, Math.min(30, interval)) * 1000;

  function advance() {
    setActive((prev) => {
      const next = (prev + 1) % slides.length;
      setLeaving(prev);
      setTimeout(() => setLeaving(null), 900); // match CSS transition
      return next;
    });
  }

  function goTo(idx: number) {
    if (idx === active) return;
    setLeaving(active);
    setTimeout(() => setLeaving(null), 900);
    setActive(idx);
    // reset timer
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length > 1) timerRef.current = setInterval(advance, ms);
  }

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(advance, ms);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, slides.length]);

  return (
    <div
      className="relative -mx-5 lg:-mx-14 overflow-hidden select-none"
      style={{ height: 'min(90vh, 700px)' }}
      aria-roledescription="carrossel"
    >
      {slides.map((slide, idx) => {
        const isActive  = idx === active;
        const isLeaving = idx === leaving;
        if (!isActive && !isLeaving) return null;

        return (
          <div
            key={idx}
            className={cn(
              'absolute inset-0 transition-opacity duration-900',
              isActive  ? 'opacity-100 z-10' : 'opacity-0 z-0',
            )}
            aria-hidden={isActive ? undefined : true}
          >
            {/* Ken Burns: zoom lento enquanto o slide está ativo */}
            <div
              className={cn(
                'absolute inset-0 will-change-transform',
                isActive ? 'animate-ken-burns' : '',
              )}
            >
              {slide.imageUrl && (
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  priority={idx === 0}
                  className="object-cover object-center"
                  sizes="100vw"
                />
              )}
            </div>

            {/* Gradient overlay */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent z-10" />

            {/* Texto do slide */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 lg:px-14 lg:pb-14 z-20">
              <div className="max-w-[520px]">
                {slide.eyebrow && (
                  <span className="block text-[9px] font-medium tracking-[0.28em] uppercase text-white/70 mb-2">
                    {slide.eyebrow}
                  </span>
                )}
                <h1 className="font-serif text-[clamp(30px,6vw,62px)] leading-[1.02] font-light text-white">
                  {slide.title}
                </h1>
                {(slide.ctaLabel || slide.ctaHref) && (
                  <Link
                    href={slide.ctaHref || '/loja'}
                    className="mt-5 inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] uppercase text-white border-b border-white/60 pb-0.5 hover:border-white transition-colors"
                    tabIndex={isActive ? 0 : -1}
                  >
                    {slide.ctaLabel || 'Ver coleção'} <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Dots — só aparecem com 2+ slides */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 right-6 lg:right-14 z-30 flex items-center gap-2" role="tablist" aria-label="Slides">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={idx === active ? true : false}
              aria-label={`Slide ${idx + 1}`}
              onClick={() => goTo(idx)}
              className={cn(
                'rounded-full transition-all duration-300',
                idx === active
                  ? 'bg-white w-5 h-1.5'
                  : 'bg-white/40 w-1.5 h-1.5 hover:bg-white/70',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
