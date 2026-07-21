'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useFavoritesStore } from '@/lib/shop/favorites-store';
import { brl } from '@/lib/utils';

export default function FavoritosPage() {
  const { items, removeFavorite } = useFavoritesStore();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  if (!mounted) return null;

  return (
    <div className="max-w-lg mx-auto pt-4 pb-28 lg:pb-10">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/conta" className="text-[12px] text-ink-soft hover:text-ink transition-colors">
          Minha conta
        </Link>
        <span className="text-ink-mute">/</span>
        <span className="text-[12px] text-ink font-medium">Favoritos</span>
      </div>

      <h1 className="font-serif text-[24px] font-normal text-ink mb-6">
        Favoritos{items.length > 0 && <span className="text-ink-mute text-[18px] ml-2">· {items.length}</span>}
      </h1>

      {items.length === 0 ? (
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
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.pieceId}
              className="flex items-center gap-4 rounded-[16px] border border-line bg-paper p-3"
            >
              {/* Foto */}
              <Link href={`/produto/${item.slug}`} className="shrink-0">
                <div className="relative w-16 h-20 rounded-[10px] overflow-hidden bg-surface">
                  {item.photoUrl ? (
                    <Image src={item.photoUrl} alt={item.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart size={16} className="text-ink-mute" />
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <Link href={`/produto/${item.slug}`} className="flex-1 min-w-0">
                {item.collectionName && (
                  <p className="text-[9px] font-medium tracking-[0.20em] uppercase text-ink-mute mb-0.5">
                    {item.collectionName}
                  </p>
                )}
                <p className="font-serif text-[15px] text-ink leading-snug truncate">{item.name}</p>
                <p className="font-serif text-[14px] text-ink-soft mt-0.5">{brl(item.price)}</p>
              </Link>

              {/* Remover */}
              <button
                type="button"
                aria-label={`Remover ${item.name} dos favoritos`}
                onClick={() => removeFavorite(item.pieceId)}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-ink-mute hover:bg-danger-soft hover:text-danger transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <Link
            href="/loja"
            className="mt-4 flex items-center justify-center gap-2 h-11 w-full rounded-full border border-line text-[11px] font-medium tracking-[0.16em] uppercase text-ink hover:bg-ink/5 transition-colors"
          >
            <ShoppingBag size={14} strokeWidth={1.5} />
            Ver mais peças
          </Link>
        </div>
      )}
    </div>
  );
}
