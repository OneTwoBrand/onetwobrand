/**
 * ONE TWO · /loja — Vitrine principal
 * SSG + ISR 600s.
 * Seções: hero coleção em destaque · carrossel de coleções · grid de produtos.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getShopCollections, getShopProducts } from '@/lib/shop/catalog';
import { CollectionCarousel } from '@/components/shop/CollectionCarousel';
import { ProductCard, ProductCardSkeleton } from '@/components/shop/ProductCard';
import { SectionHead } from '@/components/ui/Primitives';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Loja · ONE TWO',
  description: 'Peças artesanais feitas em pequenas tiragens pelo atelier ONE TWO.',
  openGraph: {
    title: 'ONE TWO · crafted pieces',
    description: 'Peças artesanais feitas em pequenas tiragens.',
    type: 'website',
  },
};

export default async function LojaPage() {
  const [{ collections }, { products }] = await Promise.all([
    getShopCollections(),
    getShopProducts(),
  ]);

  const featured = collections[0] ?? null;
  const featuredProducts = products.filter((p) => p.isNew).slice(0, 8);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Hero coleção em destaque ──────────────────────── */}
      {featured && (
        <Link
          href={`/colecoes/${featured.slug}`}
          className="block rounded-[22px] bg-primary px-6 py-8 relative overflow-hidden"
        >
          {/* Diamond decorativo */}
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
              {featured.name}
            </h1>
            {featured.subtitle && (
              <p className="text-[12px] text-paper/75 leading-[1.55]">{featured.subtitle}</p>
            )}
            <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.16em] uppercase text-paper underline underline-offset-4">
              Ver coleção <ArrowRight size={13} />
            </span>
          </div>
        </Link>
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
