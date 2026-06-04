'use client';

/**
 * ONE TWO · /conta/favoritos
 * Lista de peças salvas. Favoritos são armazenados localmente via localStorage
 * (a tabela `favorites` do Supabase será alimentada na L4 final após auth).
 * Neste sprint, exibe as peças do carrinho marcadas como favoritas.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';

export default function FavoritosPage() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => { setHasMounted(true); }, []);

  if (!hasMounted) return null;

  return (
    <div className="max-w-lg mx-auto pt-4 pb-28 lg:pb-10">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/conta" className="text-[12px] text-ink-soft hover:text-ink transition-colors">
          Minha conta
        </Link>
        <span className="text-ink-mute">/</span>
        <span className="text-[12px] text-ink font-medium">Favoritos</span>
      </div>

      <h1 className="font-serif text-[24px] font-normal text-ink mb-6">Favoritos</h1>

      <div className="flex flex-col items-center py-16 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-surface border border-line flex items-center justify-center text-primary">
          <Heart size={22} strokeWidth={1.2} />
        </div>
        <p className="font-serif text-[18px] text-ink">Nenhum favorito salvo</p>
        <p className="text-[12px] text-ink-soft max-w-[240px] leading-relaxed">
          Toque no coração em qualquer peça para salvar aqui.
        </p>
        <Link
          href="/loja"
          className="mt-2 h-11 px-6 rounded-full bg-primary text-paper text-[11px] font-medium tracking-[0.18em] uppercase flex items-center gap-2"
        >
          <ShoppingBag size={14} strokeWidth={1.5} />
          Explorar a loja
        </Link>
      </div>
    </div>
  );
}
