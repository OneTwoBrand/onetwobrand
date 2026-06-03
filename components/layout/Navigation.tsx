/**
 * ONE TWO — Layout components
 * BottomNav (mobile) · Sidebar (desktop) · AppBar (mobile)
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import {
  Home, Scissors, ShoppingCart, Package, MoreHorizontal,
  Gem, User, CircleDollarSign, BarChart3, ChevronLeft, ChevronRight,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '../ui/Primitives';

// ────────────────────────────────────────────────────────────
// BottomNav — mobile floating tab bar
// ────────────────────────────────────────────────────────────
const bottomNavItems = [
  { href: '/',           label: 'Início',   Icon: Home },
  { href: '/producao',   label: 'Produção', Icon: Scissors },
  { href: '/vendas/novo',label: 'Vendas',   Icon: ShoppingCart },
  { href: '/estoque',    label: 'Estoque',  Icon: Package },
  { href: '/mais',       label: 'Mais',     Icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 px-3 pt-2 pb-[max(22px,env(safe-area-inset-bottom))] bg-gradient-to-t from-bg to-transparent md:hidden">
      <div className="bg-paper rounded-[28px] border border-line shadow-s2 h-16 px-1.5 flex items-center justify-around">
        {bottomNavItems.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-[3px] px-2.5 py-1.5 rounded-2xl min-w-[56px] transition-colors',
                active ? 'bg-primary-soft text-primary' : 'text-ink-soft'
              )}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-[9px] font-medium tracking-[0.1em] uppercase">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ────────────────────────────────────────────────────────────
// Sidebar — desktop collapsible
// ────────────────────────────────────────────────────────────
const sidebarItems = [
  { href: '/',            label: 'Início',     Icon: Home },
  { href: '/producao',    label: 'Produção',   Icon: Scissors },
  { href: '/bordagem',    label: 'Bordagem',   Icon: Gem },
  { href: '/estoque',     label: 'Estoque',    Icon: Package },
  { href: '/clientes',    label: 'Clientes',   Icon: User },
  { href: '/vendas',      label: 'Vendas',     Icon: ShoppingCart },
  { href: '/financeiro',  label: 'Financeiro', Icon: CircleDollarSign },
  { href: '/relatorios',  label: 'Relatórios', Icon: BarChart3 },
  { href: '/assistant',   label: 'OneTwo Assistant', Icon: Bot },
];

export function Sidebar({ expanded = true, onToggle }: { expanded?: boolean; onToggle?: () => void }) {
  const pathname = usePathname();
  return (
    <aside
      style={{ width: expanded ? 240 : 76 }}
      className="hidden md:flex flex-col shrink-0 bg-paper border-r border-line pt-[52px] px-3.5 pb-4 transition-[width] duration-200"
    >
      {/* Brand lockup */}
      <div className={cn('mb-6 flex items-center gap-3', expanded ? 'px-1.5' : 'justify-center')}>
        <Image src="/one-two-logo.png" alt="ONE TWO" width={40} height={40} priority />
        {expanded && (
          <div className="flex flex-col leading-none">
            <span className="font-serif text-[15px] text-ink tracking-[0.12em] font-medium">ONE&nbsp;TWO</span>
            <span className="text-[9px] text-ink-soft tracking-[0.28em] mt-1">crafted pieces</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex flex-col gap-1">
        {sidebarItems.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={!expanded ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl transition-colors',
                expanded ? 'px-3 py-2.5' : 'p-2.5 justify-center',
                active ? 'bg-primary text-paper' : 'text-ink-soft hover:bg-ink/[0.04]'
              )}
            >
              <Icon size={18} strokeWidth={1.5} />
              {expanded && (
                <span className={cn('text-[13px]', active ? 'font-medium' : 'font-normal')}>
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <div className="h-px bg-line my-3 mx-1" />
        <div className={cn('flex items-center gap-3', expanded ? 'px-2.5 py-2' : 'p-2 justify-center')}>
          <Avatar name="Ana Toledo" size={32} tone="primary" />
          {expanded && (
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-ink font-medium truncate">Ana Toledo</div>
              <div className="text-[10px] text-ink-soft">Atelier · Admin</div>
            </div>
          )}
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className="mt-2 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-ink-soft hover:bg-ink/[0.04] text-[10px] tracking-[0.18em] uppercase"
          >
            {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            {expanded && 'Colapsar'}
          </button>
        )}
      </div>
    </aside>
  );
}

// ────────────────────────────────────────────────────────────
// AppBar — mobile, supports small + large variants
// ────────────────────────────────────────────────────────────
interface AppBarProps {
  title: ReactNode;
  eyebrow?: string;
  back?: boolean;
  onBack?: () => void;
  action?: ReactNode;
  large?: boolean;
  className?: string;
}
export function AppBar({ title, eyebrow, back, onBack, action, large, className }: AppBarProps) {
  return (
    <header className={cn('safe-pt md:hidden', large ? 'px-6 pt-1 pb-2' : 'px-5 pt-1 pb-3', className)}>
      <div className="flex items-center justify-between h-10">
        <div className="flex items-center gap-2.5">
          {back && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Voltar"
              className="w-9 h-9 rounded-full bg-paper border border-line flex items-center justify-center"
            >
              <ChevronLeft size={18} strokeWidth={1.5} className="text-ink" />
            </button>
          )}
          {!large && <span className="font-serif text-[18px] text-ink">{title}</span>}
        </div>
        {action}
      </div>
      {large && (
        <div className="mt-3">
          {eyebrow && (
            <div className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-1">
              {eyebrow}
            </div>
          )}
          <h1 className="font-serif text-[30px] leading-[1.1] text-ink tracking-tight-1 m-0">{title}</h1>
        </div>
      )}
    </header>
  );
}

// ────────────────────────────────────────────────────────────
// Topbar — desktop
// ────────────────────────────────────────────────────────────
export function Topbar({ eyebrow, title, action }: { eyebrow?: ReactNode; title: ReactNode; action?: ReactNode }) {
  return (
    <header className="hidden md:flex h-[76px] px-9 border-b border-line items-center justify-between shrink-0">
      <div>
        {eyebrow && (
          <div className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-1">
            {eyebrow}
          </div>
        )}
        <h1 className="font-serif text-[26px] text-ink leading-none m-0 font-normal">{title}</h1>
      </div>
      {action}
    </header>
  );
}
