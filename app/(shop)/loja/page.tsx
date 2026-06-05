/**
 * ONE TWO · /loja — Vitrine principal
 * SSG + ISR 600s quando sem query; dinâmico quando q= presente.
 * Seções: hero · carrossel · barra de busca · grid de produtos.
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { getShopCollections, getShopProducts } from '@/lib/shop/catalog';
import { getPlatformConfig } from '@/lib/platform-config';
import { getShopConfig } from '@/app/(app)/mais/shop-config-actions';
import { parseHeroSlides } from '@/lib/shop/hero-utils';
import { parseShopVisualConfig } from '@/lib/shop/visual-config';
import { CollectionCarousel } from '@/components/shop/CollectionCarousel';
import { FavoriteProductGrid } from '@/components/shop/FavoriteProductGrid';
import { ShopHero } from '@/components/shop/ShopHero';
import { SearchBar } from '@/components/shop/SearchBar';
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

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function LojaPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query  = q?.trim() || undefined;

  const [{ collections }, { products }, shopConfig] = await Promise.all([
    getShopCollections(),
    getShopProducts({ query }),
    getShopConfig(),
  ]);

  const slides   = parseHeroSlides(shopConfig);
  const interval = parseInt(shopConfig['shop_hero_interval'] || '7', 10);
  const visual   = parseShopVisualConfig(shopConfig);
  const featuredCollections = collections.filter((collection) => collection.featured);
  const fallbackCollections = featuredCollections.length > 0
    ? featuredCollections
    : collections[0]
      ? [collections[0]]
      : [];

  // Sem busca: prioriza produtos novos; com busca: mostra todos os resultados
  const displayProducts = query
    ? products
    : (products.filter((p) => p.isNew).slice(0, 8) || products.slice(0, 8));

  const sectionEyebrow = query ? `${products.length} resultado${products.length !== 1 ? 's' : ''}` : 'Em destaque';
  const sectionTitle   = query ? `"${query}"` : 'Selecionadas pelo atelier';

  return (
    <div className="flex flex-col gap-8">
      {/* ── Hero (oculto durante busca) ───────────────────── */}
      {!query && (slides.length > 0 || fallbackCollections.length > 0) && (
        <ShopHero
          slides={slides}
          interval={interval}
          fallbackCollections={fallbackCollections}
          visual={visual}
        />
      )}

      {/* ── Carrossel de coleções (oculto durante busca) ─── */}
      {!query && collections.length > 0 && (
        <section className={visual.sectionReveal ? 'shop-reveal' : undefined}>
          <SectionHead eyebrow="Navegue por" title="Coleções" className="mb-3" />
          <CollectionCarousel collections={collections} cardMotion={visual.collectionCardMotion} />
        </section>
      )}

      {/* ── Barra de busca ────────────────────────────────── */}
      <Suspense>
        <SearchBar />
      </Suspense>

      {/* ── Grid de produtos ──────────────────────────────── */}
      <section className={visual.sectionReveal ? 'shop-reveal shop-reveal-delay' : undefined}>
        <SectionHead
          eyebrow={sectionEyebrow}
          title={sectionTitle}
          action={
            !query ? (
              <Link
                href="/loja"
                className="text-[11px] font-medium tracking-[0.16em] uppercase text-ink-soft underline underline-offset-4 hover:text-ink transition-colors"
              >
                Ver todas
              </Link>
            ) : (
              <Link
                href="/loja"
                className="text-[11px] font-medium tracking-[0.16em] uppercase text-ink-soft underline underline-offset-4 hover:text-ink transition-colors"
              >
                Limpar
              </Link>
            )
          }
        />

        {displayProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <svg aria-hidden viewBox="0 0 64 64" fill="none" className="w-12 h-12 text-primary/20 mb-2">
              <rect x="32" y="2" width="42" height="42" rx="3" transform="rotate(45 32 2)" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            {query ? (
              <>
                <p className="font-serif text-[28px] font-light text-ink leading-tight">
                  Nenhuma peça<br />com esse nome.
                </p>
                <p className="text-[12px] text-ink-soft max-w-xs leading-[1.7]">
                  Tente palavras como o tecido, a cor ou a categoria —<br />
                  ou explore nossas coleções.
                </p>
                <Link
                  href="/loja/colecoes"
                  className="mt-2 h-11 px-7 rounded-full border border-line text-[11px] font-medium tracking-[0.18em] uppercase text-ink hover:bg-ink/5 transition-colors flex items-center"
                >
                  Ver coleções
                </Link>
              </>
            ) : (
              <>
                <p className="font-serif text-[28px] font-light text-ink leading-tight">
                  Peças chegando<br />em breve.
                </p>
                <p className="text-[12px] text-ink-soft max-w-xs leading-[1.7]">
                  O atelier está em produção. Cada peça é feita à mão
                  e chegará aqui quando estiver pronta.
                </p>
              </>
            )}
          </div>
        ) : (
          <FavoriteProductGrid products={displayProducts} cardMotion={visual.productCardMotion} />
        )}
      </section>
    </div>
  );
}
