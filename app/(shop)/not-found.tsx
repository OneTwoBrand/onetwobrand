import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function ShopNotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4">
      {/* Ornamento diamond */}
      <svg
        aria-hidden
        viewBox="0 0 64 64"
        fill="none"
        className="w-14 h-14 text-primary/25 mb-8"
      >
        <rect x="32" y="2" width="42" height="42" rx="3" transform="rotate(45 32 2)" stroke="currentColor" strokeWidth="1.2" />
      </svg>

      <p className="text-[10px] font-medium tracking-[0.28em] uppercase text-ink-mute mb-3">
        Página não encontrada
      </p>

      <h1 className="font-serif text-[38px] lg:text-[48px] font-light text-ink leading-[1.05] mb-4">
        Essa peça<br />não está aqui.
      </h1>

      <p className="text-[13px] text-ink-soft leading-[1.7] max-w-[300px] mb-10">
        O endereço pode ter mudado ou a coleção foi encerrada.
        Nossa vitrine tem outras peças esperando por você.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/loja"
          className="h-12 px-8 rounded-full bg-primary text-paper text-[11px] font-medium tracking-[0.20em] uppercase flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors"
        >
          Ver a vitrine <ArrowRight size={13} />
        </Link>
        <Link
          href="/loja/colecoes"
          className="h-12 px-8 rounded-full border border-line text-ink text-[11px] font-medium tracking-[0.20em] uppercase flex items-center justify-center hover:bg-ink/5 transition-colors"
        >
          Ver coleções
        </Link>
      </div>

      <p className="mt-16 text-[10px] text-ink-mute tracking-[0.14em] uppercase">
        ONE TWO · crafted pieces
      </p>
    </div>
  );
}
