/**
 * ONE TWO · /produto/[slug] — Detalhe de produto
 * SSG + ISR 300s.
 * Galeria swipeable, seleção de tamanho, sticky dock CTA.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  getShopProductBySlug,
  getAllProductSlugs,
} from '@/lib/shop/catalog';
import { Gallery } from '@/components/shop/Gallery';
import { AddToCartButton } from './AddToCartButton';
import { brl } from '@/lib/utils';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getShopProductBySlug(slug);
  if (!product) return { title: 'Produto · ONE TWO' };

  return {
    title: `${product.name} · ONE TWO`,
    description: product.description ?? `${product.name} — peça artesanal do atelier ONE TWO.`,
    openGraph: {
      title: `${product.name} · ONE TWO`,
      description: product.description ?? '',
      images: product.photoUrl ? [{ url: product.photoUrl, width: 800, height: 1000 }] : [],
      type: 'website',
    },
    // Schema.org via JSON-LD abaixo
  };
}

export default async function ProdutoPage({ params }: PageProps) {
  const { slug } = await params;
  const { product } = await getShopProductBySlug(slug);

  if (!product) notFound();

  const images = [
    product.photoUrl       && { url: product.photoUrl,       alt: product.name },
    product.backPhotoUrl   && { url: product.backPhotoUrl,   alt: `${product.name} — costas` },
    product.detailPhotoUrl && { url: product.detailPhotoUrl, alt: `${product.name} — detalhe` },
  ].filter(Boolean) as Array<{ url: string; alt: string }>;

  const installment = product.price >= 100
    ? `4× ${brl(product.price / 4, { decimals: true })} sem juros`
    : null;

  // Schema.org Product
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.photoUrl,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'BRL',
      availability: product.isSoldOut
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Breadcrumb ────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 mb-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {[
          { href: '/loja', label: 'Loja' },
          product.collectionSlug && product.collectionName
            ? { href: `/colecoes/${product.collectionSlug}`, label: product.collectionName }
            : null,
          { href: '#', label: product.name },
        ].filter(Boolean).map((item, i, arr) => (
          <span key={i} className="flex items-center gap-1.5 shrink-0">
            {i < arr.length - 1 ? (
              <>
                <Link href={item!.href} className="text-[10px] font-medium tracking-[0.18em] uppercase text-ink-mute hover:text-ink transition-colors">
                  {item!.label}
                </Link>
                <ChevronRight size={11} className="text-ink-mute" />
              </>
            ) : (
              <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-ink">{item!.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* ── Layout: empilhado mobile / split desktop ──────── */}
      <div className="flex flex-col lg:flex-row lg:gap-14">
        {/* Galeria */}
        <div className="lg:flex-1 lg:max-w-[55%]">
          <Gallery images={images} productName={product.name} />
        </div>

        {/* Detalhes */}
        <div className="lg:flex-1 lg:max-w-[45%] mt-5 lg:mt-0">
          {/* Coleção + nome + preço */}
          {product.collectionName && (
            <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-mute">
              {product.collectionName}
            </span>
          )}
          <h1 className="font-serif text-[28px] lg:text-[36px] font-light text-ink leading-[1.1] mt-1">
            {product.name}
          </h1>
          {product.fabric && (
            <p className="text-[13px] italic text-ink-soft mt-0.5">{product.fabric}</p>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-serif text-[26px] text-ink">{brl(product.price)}</span>
            {installment && (
              <span className="text-[11px] text-ink-soft">ou {installment}</span>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            {!product.isSoldOut && (
              <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-success bg-success-soft px-2.5 py-1 rounded-full">
                Em estoque
              </span>
            )}
            {product.isNew && (
              <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-primary bg-primary-soft px-2.5 py-1 rounded-full">
                Novo
              </span>
            )}
          </div>

          {/* Seleção de tamanho */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft">
                Tamanho
              </span>
              <button type="button" className="text-[10px] font-medium tracking-[0.14em] uppercase text-ink-mute underline underline-offset-4">
                Guia de medidas
              </button>
            </div>

            {/* AddToCartButton gerencia seleção de tamanho e CTA */}
            <AddToCartButton product={product} />
          </div>

          {/* Descrição */}
          {product.description && (
            <p className="mt-5 text-[13px] text-ink-soft leading-[1.6]">{product.description}</p>
          )}

          {/* Card informativo */}
          <div className="mt-6 rounded-[14px] bg-surface p-4 flex gap-3 items-start">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 shrink-0 text-ink-mute mt-0.5">
              <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
            <div>
              <div className="text-[12px] font-medium text-ink">Feita à mão sob demanda</div>
              <div className="text-[11px] text-ink-soft mt-0.5 leading-[1.5]">
                Cada peça é produzida no atelier ONE TWO após o pedido confirmado.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
