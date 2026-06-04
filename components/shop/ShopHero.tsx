import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface ShopHeroProps {
  imageUrl?: string;
  eyebrow?: string;
  title?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Fallback: coleção em destaque quando o hero não está configurado */
  fallbackCollectionName?: string;
  fallbackCollectionSubtitle?: string;
  fallbackCollectionSlug?: string;
}

export function ShopHero({
  imageUrl,
  eyebrow,
  title,
  ctaLabel,
  ctaHref,
  fallbackCollectionName,
  fallbackCollectionSubtitle,
  fallbackCollectionSlug,
}: ShopHeroProps) {
  const hasHeroConfig = Boolean(imageUrl && title);

  // ── Full-screen photo hero (Zara style) ──────────────────────────────────
  if (hasHeroConfig) {
    const href = ctaHref || (fallbackCollectionSlug ? `/loja/colecoes/${fallbackCollectionSlug}` : '/loja');

    return (
      <div className="relative -mx-5 lg:-mx-14 overflow-hidden" style={{ height: 'min(90vh, 700px)' }}>
        {/* Background image */}
        <Image
          src={imageUrl!}
          alt={title!}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Gradient overlay — bottom to top, subtle */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
        />

        {/* Content — bottom-left, Zara-style */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 lg:px-14 lg:pb-12">
          <div className="max-w-[480px]">
            {eyebrow && (
              <span className="block text-[9px] font-medium tracking-[0.28em] uppercase text-white/70 mb-2">
                {eyebrow}
              </span>
            )}
            <h1 className="font-serif text-[clamp(32px,6vw,64px)] leading-[1.02] font-light text-white">
              {title}
            </h1>
            {(ctaLabel || fallbackCollectionName) && (
              <Link
                href={href}
                className="mt-5 inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] uppercase text-white border-b border-white/60 pb-0.5 hover:border-white transition-colors"
              >
                {ctaLabel || 'Ver coleção'} <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Fallback: card colorido (comportamento anterior) ──────────────────────
  if (!fallbackCollectionName) return null;

  return (
    <Link
      href={fallbackCollectionSlug ? `/loja/colecoes/${fallbackCollectionSlug}` : '/loja'}
      className="block rounded-[22px] bg-primary px-6 py-8 relative overflow-hidden"
    >
      <svg
        aria-hidden
        className="absolute bottom-[-20%] right-[-8%] w-[55%] opacity-[0.14] pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
      >
        <rect x="100" y="4" width="136" height="136" rx="4" transform="rotate(45 100 4)" stroke="#FBF6E4" strokeWidth="1.5" />
      </svg>
      <div className="relative z-10 flex flex-col gap-2 max-w-[280px]">
        <span className="text-[9px] font-medium tracking-[0.24em] uppercase text-paper/70">
          Coleção em destaque
        </span>
        <h1 className="font-serif text-[32px] leading-[1.05] font-light text-paper">
          {fallbackCollectionName}
        </h1>
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
