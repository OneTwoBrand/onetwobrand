import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getShopCollections } from '@/lib/shop/catalog';
import { SectionHead } from '@/components/ui/Primitives';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Coleções · ONE TWO',
  description: 'Explore as coleções artesanais ONE TWO — peças feitas em pequenas tiragens.',
  openGraph: {
    title: 'Coleções · ONE TWO',
    description: 'Peças artesanais em pequenas tiragens.',
    type: 'website',
  },
};

export default async function ColecoesShopPage() {
  const { collections } = await getShopCollections();

  return (
    <div className="flex flex-col gap-8">
      <SectionHead eyebrow="Portfólio" title="Coleções" />

      {collections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="font-serif text-[18px] text-ink">Em breve, novas coleções.</p>
          <p className="text-[12px] text-ink-soft text-center max-w-[200px] leading-[1.55]">
            Estamos preparando a próxima temporada.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/colecoes/${col.slug}`}
              className="block rounded-[22px] bg-primary px-6 py-8 relative overflow-hidden group"
            >
              <svg
                aria-hidden
                className="absolute bottom-[-20%] right-[-8%] w-[55%] opacity-[0.14] pointer-events-none"
                viewBox="0 0 200 200"
                fill="none"
              >
                <rect x="100" y="4" width="136" height="136" rx="4" transform="rotate(45 100 4)" stroke="#FBF6E4" strokeWidth="1.5" />
              </svg>

              <div className="relative z-10 flex flex-col gap-2">
                <span className="text-[9px] font-medium tracking-[0.24em] uppercase text-paper/70">
                  {col.pieceCount} {col.pieceCount === 1 ? 'peça' : 'peças'}
                </span>
                <h2 className="font-serif text-[28px] leading-[1.05] font-light text-paper">
                  {col.name}
                </h2>
                {col.subtitle && (
                  <p className="text-[12px] text-paper/75 leading-[1.55]">{col.subtitle}</p>
                )}
                <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.16em] uppercase text-paper underline underline-offset-4">
                  Ver coleção <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
