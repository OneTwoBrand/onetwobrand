'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Reporta ao console em dev; em prod pode conectar a um serviço de monitoramento
    console.error('[ONE TWO shop error]', error);
  }, [error]);

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
        Algo saiu do lugar
      </p>

      <h1 className="font-serif text-[38px] lg:text-[48px] font-light text-ink leading-[1.05] mb-4">
        Um momento<br />de silêncio.
      </h1>

      <p className="text-[13px] text-ink-soft leading-[1.7] max-w-[300px] mb-10">
        Houve um erro inesperado nesta página. Já fomos avisados
        e estamos cuidando disso — artesanalmente.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={reset}
          className="h-12 px-8 rounded-full bg-primary text-paper text-[11px] font-medium tracking-[0.20em] uppercase flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors"
        >
          <RefreshCw size={13} />
          Tentar novamente
        </button>
        <Link
          href="/loja"
          className="h-12 px-8 rounded-full border border-line text-ink text-[11px] font-medium tracking-[0.20em] uppercase flex items-center justify-center hover:bg-ink/5 transition-colors"
        >
          Voltar à loja
        </Link>
      </div>

      {error.digest && (
        <p className="mt-12 text-[10px] text-ink-mute font-mono tracking-wide">
          ref: {error.digest}
        </p>
      )}
    </div>
  );
}
