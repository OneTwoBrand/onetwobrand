'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ONE TWO error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 text-center">
      <span className="text-[11px] font-medium tracking-[0.32em] uppercase text-ink-mute mb-12">
        ONE TWO · crafted pieces
      </span>

      <svg
        aria-hidden
        viewBox="0 0 80 80"
        fill="none"
        className="w-16 h-16 text-primary/20 mb-8"
      >
        <rect x="40" y="2" width="52" height="52" rx="3" transform="rotate(45 40 2)" stroke="currentColor" strokeWidth="1.2" />
      </svg>

      <h1 className="font-serif text-[42px] font-light text-ink leading-[1.05] mb-3">
        Algo não saiu como esperado
      </h1>

      <p className="text-[13px] text-ink-soft leading-[1.7] max-w-[320px] mb-10">
        Ocorreu um erro inesperado. Nossa equipe já foi notificada.
        Você pode tentar novamente ou voltar ao início.
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
          href="/"
          className="h-12 px-8 rounded-full border border-line text-ink text-[11px] font-medium tracking-[0.20em] uppercase flex items-center justify-center hover:bg-ink/5 transition-colors"
        >
          Ir para o início
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
