/**
 * ONE TWO · ShopHeader
 * Top bar da loja pública — wordmark + busca + sacola.
 * Mobile: 56px, wordmark centralizado, ícones nas pontas.
 * Desktop (lg+): 84px sticky, nav central, search pill, conta.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const desktopNav = [
  { href: '/loja',      label: 'Loja' },
  { href: '/colecoes',  label: 'Coleções' },
];

export function ShopHeader({ cartCount = 0 }: { cartCount?: number }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-bg border-b border-line">
      {/* ── Mobile (até lg) ────────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between h-14 px-5">
        <Link href="/loja" aria-label="Buscar" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ink/5 transition-colors">
          <Search size={20} className="text-ink" />
        </Link>

        <Link href="/loja" className="absolute left-1/2 -translate-x-1/2">
          <Image
            src="/one-two-logo.png"
            alt="ONE TWO"
            width={80}
            height={28}
            className="object-contain"
            priority
          />
        </Link>

        <Link href="/carrinho" aria-label={`Sacola${cartCount > 0 ? `, ${cartCount} item` : ''}`} className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-ink/5 transition-colors">
          <ShoppingBag size={20} className="text-ink" />
          {cartCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-paper text-[9px] font-medium flex items-center justify-center leading-none">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* ── Desktop (lg+) ──────────────────────────────────── */}
      <div className="hidden lg:flex items-center justify-between h-[84px] px-14 max-w-[1400px] mx-auto w-full">
        <Link href="/loja">
          <Image
            src="/one-two-logo.png"
            alt="ONE TWO"
            width={96}
            height={34}
            className="object-contain"
            priority
          />
        </Link>

        <nav className="flex items-center gap-8">
          {desktopNav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'text-[12px] font-medium tracking-[0.18em] uppercase transition-colors',
                pathname.startsWith(href) ? 'text-primary' : 'text-ink hover:text-primary'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/loja" aria-label="Buscar" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ink/5 transition-colors">
            <Search size={18} className="text-ink" />
          </Link>
          <Link href="/conta" aria-label="Minha conta" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ink/5 transition-colors">
            <User size={18} className="text-ink" />
          </Link>
          <Link
            href="/carrinho"
            aria-label={`Sacola${cartCount > 0 ? `, ${cartCount} item` : ''}`}
            className="relative flex items-center gap-2 h-10 px-4 rounded-full bg-ink text-paper text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-ink/80 transition-colors"
          >
            <ShoppingBag size={15} />
            <span>Sacola</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-paper text-[10px] font-medium flex items-center justify-center leading-none">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
