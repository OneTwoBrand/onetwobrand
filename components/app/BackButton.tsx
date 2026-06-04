'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export function BackButton({ href }: { href: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className="flex items-center gap-1 text-[11px] font-medium tracking-[0.14em] uppercase text-ink-mute hover:text-ink transition-colors"
      aria-label="Voltar"
    >
      <ChevronLeft size={15} />
      Voltar
    </button>
  );
}
