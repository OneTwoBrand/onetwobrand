'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchBar({ className }: { className?: string }) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState(searchParams.get('q') ?? '');
  const [open, setOpen]   = useState(Boolean(searchParams.get('q')));

  function submit(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) {
      params.set('q', q.trim());
    } else {
      params.delete('q');
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleClear() {
    setValue('');
    submit('');
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className={cn('relative', className)}>
      {open ? (
        <div className="flex items-center h-12 gap-2 rounded-[14px] border border-primary bg-paper px-4 shadow-s1">
          <Search size={16} className="text-ink-soft shrink-0" strokeWidth={1.5} />
          <input
            ref={inputRef}
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit(value);
              if (e.key === 'Escape') handleClear();
            }}
            placeholder="Buscar peças, tecido, cor…"
            className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-mute outline-none"
            aria-label="Buscar produtos"
          />
          {value && (
            <button type="button" onClick={handleClear} aria-label="Limpar busca"
              className="text-ink-mute hover:text-ink transition-colors">
              <X size={15} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
          className="flex items-center h-12 gap-3 rounded-[14px] border border-line bg-paper px-4 w-full text-ink-soft hover:border-ink/30 transition-colors"
          aria-label="Abrir busca"
        >
          <Search size={16} strokeWidth={1.5} />
          <span className="text-[13px]">
            {value || 'Buscar produto, coleção ou cor'}
          </span>
        </button>
      )}
    </div>
  );
}
