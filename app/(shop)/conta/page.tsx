/**
 * ONE TWO · /conta
 * Hub de Minha Conta — links para pedidos, favoritos, dados.
 * Identifica o cliente pela sessão HTTP assinada criada no checkout.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Heart, MapPin, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCustomerProfile } from '@/lib/shop/checkout-actions';

const LINKS = [
  { href: '/conta/pedidos',   icon: <Package  size={18} strokeWidth={1.5} />, label: 'Meus pedidos',   desc: 'Acompanhe o status de cada peça' },
  { href: '/conta/favoritos', icon: <Heart    size={18} strokeWidth={1.5} />, label: 'Favoritos',      desc: 'Peças que você salvou' },
  { href: '/conta/enderecos', icon: <MapPin   size={18} strokeWidth={1.5} />, label: 'Endereços',      desc: 'Gerencie seus endereços de entrega' },
  { href: '/conta/dados',     icon: <User     size={18} strokeWidth={1.5} />, label: 'Meus dados',     desc: 'Nome, e-mail e telefone' },
];

export default function ContaPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [name,  setName]  = useState<string | null>(null);

  useEffect(() => {
    getCustomerProfile().then(({ profile }) => {
      setEmail(profile?.email ?? null);
      setName(profile?.name ?? null);
    });
  }, []);

  return (
    <div className="max-w-lg mx-auto pt-4 pb-28 lg:pb-10">
      {/* Header pessoal */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.24em] uppercase text-ink-soft mb-1">Minha conta</p>
        {name ? (
          <h1 className="font-serif text-[28px] font-normal text-ink leading-tight">
            Olá, {name.split(' ')[0]}.
          </h1>
        ) : (
          <h1 className="font-serif text-[28px] font-normal text-ink leading-tight">
            Bem-vinda à sua conta.
          </h1>
        )}
        {email && (
          <p className="text-[12px] text-ink-soft mt-1">{email}</p>
        )}
      </div>

      {/* Menu */}
      <nav className="space-y-2">
        {LINKS.map(({ href, icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-4 px-4 py-4 rounded-[16px]',
              'bg-paper border border-line',
              'hover:border-primary/40 hover:bg-primary/[0.02] transition-colors'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-ink">{label}</p>
              <p className="text-[11px] text-ink-soft mt-0.5">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-ink-mute shrink-0" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
