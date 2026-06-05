import type { Metadata } from 'next';
import { getShopProducts } from '@/lib/shop/catalog';
import { FavoriteProductGrid } from '@/components/shop/FavoriteProductGrid';
import { SectionHead } from '@/components/ui/Primitives';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Produtos · ONE TWO',
  description: 'Explore todas as peças artesanais ONE TWO — criadas em pequenas tiragens com cuidado e detalhe.',
  openGraph: {
    title: 'Produtos · ONE TWO',
    description: 'Peças artesanais em pequenas tiragens.',
    type: 'website',
  },
};

export default async function ProdutosPage() {
  const { products } = await getShopProducts();

  return (
    <div className="flex flex-col gap-8">
      <SectionHead eyebrow="Catálogo" title="Todos os produtos" />

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <svg aria-hidden viewBox="0 0 64 64" fill="none" className="w-12 h-12 text-primary/20 mb-2">
            <rect x="32" y="2" width="42" height="42" rx="3" transform="rotate(45 32 2)" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <p className="font-serif text-[28px] font-light text-ink leading-tight">
            Uma nova coleção<br />está a caminho.
          </p>
          <p className="text-[12px] text-ink-soft max-w-[240px] leading-[1.7]">
            Nossas costureiras estão preparando cada peça com cuidado.
            Em breve os produtos estarão disponíveis aqui.
          </p>
        </div>
      ) : (
        <FavoriteProductGrid products={products} />
      )}
    </div>
  );
}
