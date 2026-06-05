/**
 * ONE TWO · ShopNav
 * Bottom nav flutuante da loja — mobile only.
 * 4 destinos: Loja / Coleções / Sacola / Conta.
 * Respeita safe-area-inset-bottom.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers3, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const baseNavItems = [
  { href: '/loja',           label: 'Loja',     Icon: Home,         isCart: false },
  { href: '/loja/colecoes',  label: 'Coleções', Icon: Layers3,      isCart: false },
  { href: '/carrinho',       label: 'Sacola',   Icon: ShoppingBag,  isCart: true  },
  { href: '/conta',          label: 'Conta',    Icon: User,         isCart: false },
];

export function ShopNav({ cartCount = 0, showCart = false }: { cartCount?: number; showCart?: boolean }) {
  const pathname = usePathname();
  const navItems = baseNavItems.filter((item) => !item.isCart || showCart);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-paper border-t border-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-16">
        {navItems.map(({ href, label, Icon, isCart }) => {
          const active = pathname === href || (href !== '/loja' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
                active ? 'text-primary' : 'text-ink-mute'
              )}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={active ? 2 : 1.5} />
                {isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-primary text-paper text-[9px] font-medium flex items-center justify-center leading-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </span>
              <span className={cn('text-[10px] font-medium tracking-[0.12em] uppercase', active && 'text-primary')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
