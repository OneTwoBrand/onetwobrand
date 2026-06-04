/**
 * ONE TWO · /colecoes/[slug] — Página de coleção
 * SSG + ISR 600s.
 * Filtros por tamanho/categoria em bottom sheet.
 * Esgotadas ficam visíveis com opacity reduzida.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getShopCollectionBySlug,
  getShopProducts,
  getAllCollectionSlugs,
} from '@/lib/shop/catalog';
import { ProductCard } from '@/components/shop/ProductCard';
import { CollectionFilters } from './CollectionFilters';

export const revalidate = 600;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tamanho?: string; categoria?: string; disponivel?: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllCollectionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { collection } = await getShopCollectionBySlug(slug);
  if (!collection) return { title: 'Coleção · ONE TWO' };
  return {
    title: `${collection.name} · ONE TWO`,
    description: collection.subtitle ?? `Coleção ${collection.name} — peças artesanais ONE TWO.`,
    openGraph: {
      title: `${collection.name} · ONE TWO`,
      description: collection.subtitle ?? '',
      type: 'website',
    },
  };
}

export default async function ColecaoPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const filters = await searchParams;

  const [{ collection }, { products }] = await Promise.all([
    getShopCollectionBySlug(slug),
    getShopProducts({ collectionSlug: slug }),
  ]);

  if (!collection) notFound();

  // Aplicar filtros via searchParams (compartilháveis por URL)
  let filtered = products;
  if (filters.tamanho) {
    filtered = filtered.filter((p) => p.allSizes.includes(filters.tamanho!));
  }
  if (filters.categoria) {
    filtered = filtered.filter((p) => p.category === filters.categoria);
  }
  if (filters.disponivel === '1') {
    filtered = filtered.filter((p) => !p.isSoldOut);
  }

  const availableCount = products.filter((p) => !p.isSoldOut).length;

  // Opções únicas para filtros
  const allSizes = Array.from(new Set(products.flatMap((p) => p.allSizes)));
  const allCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Cabeçalho da coleção ──────────────────────────── */}
      <div>
        <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-mute">
          Coleção · {collection.pieceCount} peças
        </span>
        <h1 className="font-serif text-[36px] font-light text-ink leading-[1.1] mt-1">
          {collection.name}
        </h1>
        {collection.subtitle && (
          <p className="text-[12px] text-ink-soft leading-[1.55] mt-1.5 max-w-[480px]">
            {collection.subtitle}
          </p>
        )}
      </div>

      {/* ── Filtros ───────────────────────────────────────── */}
      <CollectionFilters
        sizes={allSizes}
        categories={allCategories}
        availableCount={availableCount}
        totalCount={products.length}
        activeFilters={filters}
      />

      {/* ── Grid de produtos ──────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-ink-mute" stroke="currentColor" strokeWidth={1.5}>
              <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5" />
            </svg>
          </div>
          <p className="font-serif text-[18px] text-ink">Coleção esgotada por enquanto.</p>
          <p className="text-[12px] text-ink-soft text-center max-w-[200px] leading-[1.55]">
            Novos exemplares chegam em breve.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
          {filtered.map((product) => (
            <ProductCard key={product.pieceId} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
