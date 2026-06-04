/**
 * ONE TWO · /loja — Vitrine principal
 * SSG + ISR 600s.
 * Seções: hero (foto full-screen ou card fallback) · carrossel · grid de produtos.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { getShopCollections, getShopProducts } from '@/lib/shop/catalog';
import { getPlatformConfig } from '@/lib/platform-config';
import { getShopConfig } from '@/app/(app)/mais/shop-config-actions';
import { parseHeroSlides } from '@/lib/shop/hero-utils';
import { CollectionCarousel } from '@/components/shop/CollectionCarousel';
import { ProductCard } from '@/components/shop/ProductCard';
import { ShopHero } from '@/components/shop/ShopHero';
import { SectionHead } from '@/components/ui/Primitives';

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const [title, description] = await Promise.all([
    getPlatformConfig('shop_meta_title'),
    getPlatformConfig('shop_meta_description'),
  ]);

  const t = title       || 'Loja · ONE TWO';
  const d = description || 'Peças artesanais feitas em pequenas tiragens pelo atelier ONE TWO.';

  return {
    title: t,
    description: d,
    openGraph: { title: t, description: d, type: 'website' },
  };
}

export default async function LojaPage() {
  const [{ collections }, { products }, shopConfig] = await Promise.all([
    getShopCollections(),
    getShopProducts(),
    getShopConfig(),
  ]);

  const slides    = parseHeroSlides(shopConfig);
  const interval  = parseInt(shopConfig['shop_hero_interval'] || '7', 10);
  const featured  = collections[0] ?? null;
  const featuredProducts  = products.filter((p) => p.isNew).slice(0, 8);
  const displayProducts   = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Hero ──────────────────────────────────────────── */}
      {(slides.length > 0 || featured) && (
        <ShopHero
          slides={slides}
          interval={interval}
          fallbackCollectionName={featured?.name}
          fallbackCollectionSubtitle={featured?.subtitle ?? undefined}
          fallbackCollectionSlug={featured?.slug}
        />
      )}

      {/* ── Carrossel de coleções ─────────────────────────── */}
      {collections.length > 0 && (
        <section>
          <SectionHead eyebrow="Navegue por" title="Coleções" className="mb-3" />
          <CollectionCarousel collections={collections} />
        </section>
      )}

      {/* ── Grid de produtos ──────────────────────────────── */}
      <section>
        <SectionHead
          eyebrow="Em destaque"
          title="Selecionadas pelo atelier"
          action={
            <Link
              href="/loja"
              className="text-[11px] font-medium tracking-[0.16em] uppercase text-ink-soft underline underline-offset-4 hover:text-ink transition-colors"
            >
              Ver todas
            </Link>
          }
        />

        {displayProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-ink-mute" stroke="currentColor" strokeWidth={1.5}>
                <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <p className="font-serif text-[18px] text-ink">Em breve, novas peças.</p>
            <p className="text-[12px] text-ink-soft text-center max-w-[200px] leading-[1.55]">
              Estamos preparando a nova coleção.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            {displayProducts.map((product) => (
              <ProductCard key={product.pieceId} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
