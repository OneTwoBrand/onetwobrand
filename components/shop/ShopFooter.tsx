/**
 * ONE TWO · ShopFooter
 * Rodapé slim da loja pública.
 */
import Link from 'next/link';

export function ShopFooter() {
  return (
    <footer className="border-t border-line mt-16 mb-20 lg:mb-0">
      <div className="max-w-[1400px] mx-auto px-5 lg:px-14 py-6 flex flex-col lg:flex-row items-center justify-between gap-4">
        <span className="text-[11px] text-ink-mute tracking-[0.14em] uppercase">
          © ONE TWO · crafted pieces
        </span>
        <nav className="flex items-center gap-5 flex-wrap justify-center">
          {[
            { href: '/loja',     label: 'Loja' },
            { href: '#',         label: 'Trocas e devoluções' },
            { href: '#',         label: 'Privacidade' },
            { href: 'https://instagram.com', label: 'Instagram' },
          ].map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="text-[11px] text-ink-soft tracking-[0.12em] uppercase hover:text-ink transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <span className="text-[10px] text-ink-mute tracking-[0.14em] uppercase">
          Desenvolvido por Girassol Inteligência
        </span>
      </div>
    </footer>
  );
}
