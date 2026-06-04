/**
 * ONE TWO · CollectionFilters
 * Chips de filtro + bottom sheet para mobile.
 * Atualiza URL via searchParams para filtros compartilháveis.
 */
'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollectionFiltersProps {
  sizes: string[];
  categories: string[];
  availableCount: number;
  totalCount: number;
  activeFilters: {
    tamanho?: string;
    categoria?: string;
    disponivel?: string;
  };
}

export function CollectionFilters({
  sizes,
  categories,
  availableCount,
  totalCount,
  activeFilters,
}: CollectionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  function setFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
    setSheetOpen(false);
  }

  const hasActive = !!(activeFilters.tamanho || activeFilters.categoria || activeFilters.disponivel);

  return (
    <>
      {/* ── Chips de filtro ─────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {/* Botão filtros */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cn(
            'shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full border text-[11px] font-medium tracking-[0.12em] uppercase transition-colors',
            hasActive
              ? 'bg-ink text-paper border-ink'
              : 'bg-transparent text-ink border-line hover:border-ink'
          )}
        >
          <SlidersHorizontal size={13} />
          Filtros
        </button>

        {/* Chip: Todas */}
        <button
          type="button"
          onClick={() => clearAll()}
          className={cn(
            'shrink-0 h-8 px-3 rounded-full border text-[11px] font-medium tracking-[0.12em] uppercase transition-colors',
            !hasActive ? 'bg-ink text-paper border-ink' : 'bg-transparent text-ink border-line hover:border-ink'
          )}
        >
          Todas · {totalCount}
        </button>

        {/* Chip: Disponíveis */}
        <button
          type="button"
          onClick={() => setFilter('disponivel', activeFilters.disponivel === '1' ? undefined : '1')}
          className={cn(
            'shrink-0 h-8 px-3 rounded-full border text-[11px] font-medium tracking-[0.12em] uppercase transition-colors',
            activeFilters.disponivel === '1' ? 'bg-ink text-paper border-ink' : 'bg-transparent text-ink border-line hover:border-ink'
          )}
        >
          Disponíveis · {availableCount}
        </button>

        {/* Chips de tamanho ativos */}
        {sizes.slice(0, 4).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter('tamanho', activeFilters.tamanho === s ? undefined : s)}
            className={cn(
              'shrink-0 h-8 px-3 rounded-full border text-[11px] font-medium tracking-[0.12em] uppercase transition-colors',
              activeFilters.tamanho === s ? 'bg-ink text-paper border-ink' : 'bg-transparent text-ink border-line hover:border-ink'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Bottom sheet de filtros ──────────────────────── */}
      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-paper rounded-t-[24px] p-6 shadow-s3"
               style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-[22px] text-ink">Filtros</h2>
              <button type="button" onClick={() => setSheetOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-ink/5">
                <X size={18} className="text-ink" />
              </button>
            </div>

            {sizes.length > 0 && (
              <div className="mb-5">
                <div className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2.5">Tamanho</div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFilter('tamanho', activeFilters.tamanho === s ? undefined : s)}
                      className={cn(
                        'h-9 px-4 rounded-full border text-[12px] font-medium tracking-[0.12em] uppercase transition-colors',
                        activeFilters.tamanho === s ? 'bg-ink text-paper border-ink' : 'bg-transparent text-ink border-line'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {categories.length > 0 && (
              <div className="mb-5">
                <div className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2.5">Categoria</div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFilter('categoria', activeFilters.categoria === c ? undefined : c)}
                      className={cn(
                        'h-9 px-4 rounded-full border text-[12px] font-medium tracking-[0.12em] uppercase transition-colors',
                        activeFilters.categoria === c ? 'bg-ink text-paper border-ink' : 'bg-transparent text-ink border-line'
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2.5">Disponibilidade</div>
              <button
                type="button"
                onClick={() => setFilter('disponivel', activeFilters.disponivel === '1' ? undefined : '1')}
                className={cn(
                  'h-9 px-4 rounded-full border text-[12px] font-medium tracking-[0.12em] uppercase transition-colors',
                  activeFilters.disponivel === '1' ? 'bg-ink text-paper border-ink' : 'bg-transparent text-ink border-line'
                )}
              >
                Somente disponíveis
              </button>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={clearAll}
                className="flex-1 h-12 rounded-full border border-line text-[12px] font-medium tracking-[0.16em] uppercase text-ink hover:bg-ink/5 transition-colors"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 h-12 rounded-full bg-primary text-paper text-[12px] font-medium tracking-[0.16em] uppercase hover:bg-primary-hover transition-colors"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
