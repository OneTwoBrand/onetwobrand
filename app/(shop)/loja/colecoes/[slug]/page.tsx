/**
 * ONE TWO · /loja/colecoes/[slug] — Página de coleção
 * SSG + ISR 600s.
 * Filtros por tamanho/categoria em bottom sheet.
 * Esgotadas ficam visíveis com opacity reduzida.
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  getShopCollectionBySlug,
  getShopProducts,
  getAllCollectionSlugs,
} from '@/lib/shop/catalog';
import { FavoriteProductGrid } from '@/components/shop/FavoriteProductGrid';
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
      {collection.heroUrl ? (
        <div className="relative -mx-5 lg:-mx-14 overflow-hidden rounded-b-[22px]" style={{ height: 'min(55vh, 420px)' }}>
          <Image
            src={collection.heroUrl}
            alt={collection.name}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 lg:px-14 lg:pb-10">
            <span className="block text-[9px] font-medium tracking-[0.28em] uppercase text-white/60 mb-1.5">
              Coleção · {collection.pieceCount} {collection.pieceCount === 1 ? 'peça' : 'peças'}
            </span>
            <h1 className="font-serif text-[clamp(28px,5vw,52px)] font-light text-white leading-[1.05]">
              {collection.name}
            </h1>
            {collection.subtitle && (
              <p className="text-[12px] text-white/75 leading-[1.55] mt-1.5 max-w-[480px]">
                {collection.subtitle}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-mute">
            Coleção · {collection.pieceCount} {collection.pieceCount === 1 ? 'peça' : 'peças'}
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
      )}

      {/* ── Filtros ───────────────────────────────────────── */}
      <Suspense>
        <CollectionFilters
          sizes={allSizes}
          categories={allCategories}
          availableCount={availableCount}
          totalCount={products.length}
          activeFilters={filters}
        />
      </Suspense>

      {/* ── Grid de produtos ──────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <svg aria-hidden viewBox="0 0 64 64" fill="none" className="w-12 h-12 text-primary/20 mb-2">
            <rect x="32" y="2" width="42" height="42" rx="3" transform="rotate(45 32 2)" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <p className="font-serif text-[28px] font-light text-ink leading-tight">
            {filters.tamanho || filters.categoria || filters.disponivel
              ? 'Nenhuma peça\ncom esse filtro.'
              : 'Cada peça desta\ncoleção encontrou seu lar.'}
          </p>
          <p className="text-[12px] text-ink-soft max-w-xs leading-[1.7]">
            {filters.tamanho || filters.categoria || filters.disponivel
              ? 'Tente remover os filtros para ver mais opções.'
              : 'Uma nova tiragem está sendo preparada. Volte em breve.'}
          </p>
        </div>
      ) : (
        <FavoriteProductGrid products={filtered} />
      )}
    </div>
  );
}
