'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Camera, ChevronDown, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSafePublicHref, type InstitutionalSlide } from '@/lib/shop/institutional';

type Props = {
  slides: InstitutionalSlide[];
  eyebrow: string;
  brandTitle: string;
  intro: string;
  interval: number;
  instagramHref: string | null;
  whatsappHref: string | null;
};

export function InstitutionalFanpage({
  slides, eyebrow, brandTitle, intro, interval, instagramHref, whatsappHref,
}: Props) {
  const [active, setActive] = useState(0);
  const current = slides[active] ?? slides[0];
  const intervalMs = Math.max(4, Math.min(20, interval)) * 1000;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % slides.length), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, slides.length]);

  if (!current) return null;

  const previous = () => setActive((index) => (index - 1 + slides.length) % slides.length);
  const next = () => setActive((index) => (index + 1) % slides.length);

  return (
    <main className="institutional-page min-h-[100svh] overflow-hidden bg-ink text-paper">
      <section className="relative min-h-[100svh] isolate">
        {slides.map((slide, index) => {
          const visible = index === active;
          return (
            <div
              key={`${slide.title}-${index}`}
              className={cn(
                'absolute inset-0 transition-opacity duration-1000',
                visible ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              )}
              aria-hidden={!visible}
            >
              {slide.imageUrl ? (
                <Image
                  src={slide.imageUrl}
                  alt=""
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className={cn('object-cover institutional-parallax', visible && 'institutional-parallax-active')}
                />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(130deg,#3d1a1a_0%,#6f1628_48%,#c88b5a_160%)]" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,10,10,.77),rgba(24,10,10,.18)_65%,rgba(24,10,10,.42)),linear-gradient(0deg,rgba(24,10,10,.72),transparent_52%)]" />
            </div>
          );
        })}

        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-5 lg:px-12 lg:py-8">
          <Link href="/apresentacao" className="text-[13px] font-medium tracking-[0.28em] uppercase text-white" aria-label="ONE TWO">
            ONE TWO
          </Link>
          <nav className="flex items-center gap-3">
            {instagramHref && <a href={instagramHref} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white hover:text-ink"><Camera size={16} /></a>}
            {whatsappHref && <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white hover:text-ink"><MessageCircle size={16} /></a>}
          </nav>
        </header>

        <div className="relative z-20 flex min-h-[100svh] items-end px-5 pb-24 pt-32 lg:px-12 lg:pb-20">
          <div className="grid w-full max-w-[1340px] gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-4 text-[10px] font-medium tracking-[0.28em] uppercase text-white/70">{current.eyebrow || eyebrow}</p>
              <h1 className="max-w-3xl font-serif text-[42px] font-light leading-[.96] text-white sm:text-[58px] lg:text-[86px]">{current.title || brandTitle}</h1>
              <p className="mt-5 max-w-xl text-[14px] leading-[1.7] text-white/82 lg:text-[16px]">{current.description || intro}</p>
              {current.ctaLabel && (
                <a href={getSafePublicHref(current.ctaHref)} className="mt-8 inline-flex items-center gap-3 border-b border-white/70 pb-2 text-[11px] font-medium tracking-[0.2em] uppercase text-white transition-colors hover:border-white">
                  {current.ctaLabel} <ArrowRight size={15} />
                </a>
              )}
            </div>

            <div id="contato" className="border-l border-white/25 pl-4 lg:pb-1">
              <p className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/60">{String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</p>
              <p className="mt-3 font-serif text-[22px] font-light leading-tight text-white">{brandTitle}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-white/70">Peças autorais feitas em pequenas tiragens, com tempo, técnica e presença.</p>
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-7 right-5 z-30 flex items-center gap-3 lg:right-12">
            <button type="button" onClick={previous} aria-label="Slide anterior" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white hover:bg-white hover:text-ink"><ArrowLeft size={16} /></button>
            <div className="flex items-center gap-2" role="tablist" aria-label="Apresentação ONE TWO">
              {slides.map((slide, index) => <button key={slide.title} type="button" role="tab" aria-selected={index === active} aria-label={`Ver ${slide.title}`} onClick={() => setActive(index)} className={cn('h-1.5 rounded-full transition-all', index === active ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70')} />)}
            </div>
            <button type="button" onClick={next} aria-label="Próximo slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white hover:bg-white hover:text-ink"><ArrowRight size={16} /></button>
          </div>
        )}
        <ChevronDown aria-hidden className="absolute bottom-7 left-5 z-30 animate-bounce text-white/70 lg:left-12" size={20} />
      </section>
    </main>
  );
}
