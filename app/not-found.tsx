import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 text-center">
      {/* Wordmark */}
      <span className="text-[11px] font-medium tracking-[0.32em] uppercase text-ink-mute mb-12">
        ONE TWO · crafted pieces
      </span>

      {/* Ornamento */}
      <svg
        aria-hidden
        viewBox="0 0 80 80"
        fill="none"
        className="w-16 h-16 text-primary/20 mb-8"
      >
        <rect x="40" y="2" width="52" height="52" rx="3" transform="rotate(45 40 2)" stroke="currentColor" strokeWidth="1.2" />
      </svg>

      <h1 className="font-serif text-[42px] font-light text-ink leading-[1.05] mb-3">
        Página não encontrada
      </h1>

      <p className="text-[13px] text-ink-soft leading-[1.7] max-w-[320px] mb-10">
        Essa peça saiu do nosso catálogo — ou talvez nunca tenha chegado.
        Volte à loja e encontre algo especial.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/loja"
          className="h-12 px-8 rounded-full bg-primary text-paper text-[11px] font-medium tracking-[0.20em] uppercase flex items-center justify-center hover:bg-primary-hover transition-colors"
        >
          Explorar a loja
        </Link>
        <Link
          href="/"
          className="h-12 px-8 rounded-full border border-line text-ink text-[11px] font-medium tracking-[0.20em] uppercase flex items-center justify-center hover:bg-ink/5 transition-colors"
        >
          Início
        </Link>
      </div>

      <p className="mt-16 text-[10px] text-ink-mute tracking-[0.14em] uppercase">
        Erro 404
      </p>
    </div>
  );
}
