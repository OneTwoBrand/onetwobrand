/**
 * ONE TWO — Layout components
 * BottomNav (mobile) · Sidebar (desktop) · AppBar (mobile)
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useState, useEffect } from 'react';
import {
  Home, Scissors, ShoppingCart, Package, MoreHorizontal,
  Gem, User, CircleDollarSign, BarChart3, ChevronLeft, ChevronRight,
  Bot, LogOut, Layers3, Users, X, Settings, MessageCircle,
} from 'lucide-react';
import { signOut } from '@/app/(auth)/logout/actions';
import { cn } from '@/lib/utils';
import { Avatar } from '../ui/Primitives';
import type { NavHref } from '@/lib/nav-permissions';

// ────────────────────────────────────────────────────────────
// BottomNav — mobile floating tab bar + "Mais" bottom sheet
// ────────────────────────────────────────────────────────────

const primaryNav = [
  { href: '/'         as NavHref, label: 'Início',   Icon: Home },
  { href: '/producao' as NavHref, label: 'Produção', Icon: Scissors },
  { href: '/estoque'  as NavHref, label: 'Estoque',  Icon: Package },
  { href: '/clientes' as NavHref, label: 'Clientes', Icon: User },
];

type SheetGroup = {
  label: string;
  items: { href: string; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; adminOnly?: boolean }[];
};

const sheetGroups: SheetGroup[] = [
  {
    label: 'Operacional',
    items: [
      { href: '/bordagem'    as NavHref, label: 'Bordagem',    Icon: Gem },
      { href: '/costureiras' as NavHref, label: 'Costureiras', Icon: User },
      { href: '/catalogo'    as NavHref, label: 'Coleções',    Icon: Layers3 },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { href: '/negociacoes' as NavHref, label: 'Negociações', Icon: MessageCircle },
      { href: '/vendas'      as NavHref, label: 'Vendas',      Icon: ShoppingCart },
      { href: '/financeiro'  as NavHref, label: 'Financeiro',  Icon: CircleDollarSign },
      { href: '/relatorios'  as NavHref, label: 'Relatórios',  Icon: BarChart3 },
    ],
  },
  {
    label: 'Administração',
    items: [
      { href: '/assistant' as NavHref, label: 'Assistente',   Icon: Bot },
      { href: '/mais'      as NavHref, label: 'Configurações', Icon: Settings },
      { href: '/usuarios',             label: 'Usuários',     Icon: Users, adminOnly: true },
    ],
  },
];

// Flat list for permission checking (legacy compat)
const sheetNav = sheetGroups.flatMap((g) => g.items);

export function BottomNav({
  userRole,
  navPermissions,
}: {
  userRole?: string;
  navPermissions?: NavHref[] | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const frame = requestAnimationFrame(() => setSheetOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  function isVisible(item: { href: string; adminOnly?: boolean }): boolean {
    if (item.adminOnly) return isAdmin;
    if (isAdmin) return true;
    if (!navPermissions) return true;
    return navPermissions.includes(item.href as NavHref);
  }

  const visibleSheet = sheetNav.filter(isVisible);

  const isSecondaryActive = visibleSheet.some(({ href }) =>
    href === '/mais' ? pathname === href : pathname.startsWith(href)
  );

  function handleSheetNav(href: string) {
    setSheetOpen(false);
    router.push(href);
  }

  return (
    <>
      {/* Tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 px-3 pt-2 pb-[max(22px,env(safe-area-inset-bottom))] bg-gradient-to-t from-bg to-transparent md:hidden">
        <div className="bg-paper rounded-[28px] border border-line shadow-s2 h-16 px-1.5 flex items-center justify-around">
          {primaryNav.map(({ href, label, Icon }) => {
            if (!isAdmin && navPermissions && !navPermissions.includes(href)) return null;
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

          {/* "Mais" button — opens sheet */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={cn(
              'flex flex-col items-center gap-[3px] px-2.5 py-1.5 rounded-2xl min-w-[56px] transition-colors',
              isSecondaryActive ? 'bg-primary-soft text-primary' : 'text-ink-soft'
            )}
          >
            <MoreHorizontal size={20} strokeWidth={1.5} />
            <span className="text-[9px] font-medium tracking-[0.1em] uppercase">Mais</span>
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm md:hidden"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 md:hidden transition-transform duration-300 ease-out',
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="bg-paper rounded-t-[28px] border-t border-line shadow-s2 px-5 pt-4 pb-[max(28px,env(safe-area-inset-bottom))]">
          {/* Handle + header */}
          <div className="flex items-center justify-between mb-4">
            <div className="mx-auto absolute left-1/2 -translate-x-1/2 top-3 w-10 h-1 rounded-full bg-line" />
            <span className="text-[10px] font-medium tracking-[0.22em] uppercase text-ink-soft">
              Mais módulos
            </span>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setSheetOpen(false)}
              className="w-7 h-7 rounded-full bg-ink/[0.06] flex items-center justify-center text-ink-soft"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>

          {/* Groups */}
          <div className="space-y-4">
            {sheetGroups.map((group) => {
              const visibleItems = group.items.filter(isVisible);
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.label}>
                  <p className="mb-2 px-0.5 text-[9px] font-medium tracking-[0.22em] uppercase text-ink-mute">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {visibleItems.map(({ href, label, Icon }) => {
                      const active = href === '/mais' ? pathname === href : pathname.startsWith(href);
                      return (
                        <button
                          key={href}
                          type="button"
                          onClick={() => handleSheetNav(href)}
                          className={cn(
                            'flex flex-col items-center gap-2 rounded-[16px] py-4 px-2 transition-colors',
                            active
                              ? 'bg-primary text-paper [&_*]:text-paper'
                              : 'bg-ink/[0.04] text-ink-soft hover:bg-ink/[0.08]'
                          )}
                        >
                          <Icon size={22} strokeWidth={1.5} />
                          <span className="text-[10px] font-medium tracking-[0.08em] uppercase leading-tight text-center">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sign out */}
          <div className="mt-4 pt-4 border-t border-line">
            <form action={signOut}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-[14px] py-3 text-ink-soft bg-ink/[0.04] hover:bg-ink/[0.08] transition-colors"
              >
                <LogOut size={16} strokeWidth={1.5} />
                <span className="text-[12px] font-medium tracking-[0.12em] uppercase">Sair da conta</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Sidebar — desktop collapsible
// ────────────────────────────────────────────────────────────
type SidebarItem = { href: string; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; adminOnly: boolean };
type SidebarGroup = { label: string; items: SidebarItem[] };

const sidebarGroups: SidebarGroup[] = [
  {
    label: 'Operacional',
    items: [
      { href: '/'            as NavHref, label: 'Início',      Icon: Home,     adminOnly: false },
      { href: '/producao'    as NavHref, label: 'Produção',    Icon: Scissors, adminOnly: false },
      { href: '/bordagem'    as NavHref, label: 'Bordagem',    Icon: Gem,      adminOnly: false },
      { href: '/costureiras' as NavHref, label: 'Costureiras', Icon: User,     adminOnly: false },
      { href: '/estoque'     as NavHref, label: 'Estoque',     Icon: Package,  adminOnly: false },
      { href: '/catalogo'    as NavHref, label: 'Coleções',    Icon: Layers3,  adminOnly: false },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { href: '/negociacoes' as NavHref, label: 'Negociações', Icon: MessageCircle,    adminOnly: false },
      { href: '/clientes'   as NavHref, label: 'Clientes',   Icon: User,             adminOnly: false },
      { href: '/vendas'     as NavHref, label: 'Vendas',     Icon: ShoppingCart,     adminOnly: false },
      { href: '/financeiro' as NavHref, label: 'Financeiro', Icon: CircleDollarSign, adminOnly: false },
      { href: '/relatorios' as NavHref, label: 'Relatórios', Icon: BarChart3,        adminOnly: false },
    ],
  },
  {
    label: 'Administração',
    items: [
      { href: '/assistant' as NavHref, label: 'Assistente',   Icon: Bot,     adminOnly: false },
      { href: '/mais'      as NavHref, label: 'Configurações', Icon: Settings, adminOnly: false },
      { href: '/usuarios',             label: 'Usuários',     Icon: Users,   adminOnly: true  },
    ],
  },
];

export function Sidebar({
  expanded = true,
  onToggle,
  userName,
  userEmail,
  userRole,
  navPermissions,
}: {
  expanded?: boolean;
  userRole?: string;
  navPermissions?: NavHref[] | null;
  onToggle?: () => void;
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const isAdmin = userRole === 'admin';

  function isVisible(item: { href: string; adminOnly: boolean }): boolean {
    if (item.adminOnly) return isAdmin;
    if (isAdmin) return true;
    if (!navPermissions) return true;
    return navPermissions.includes(item.href as NavHref);
  }

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

      {/* Items grouped */}
      <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">
        {sidebarGroups.map((group, gi) => {
          const visibleItems = group.items.filter(isVisible);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              {expanded && (
                <p className={cn(
                  'mb-1 text-[9px] font-medium tracking-[0.22em] uppercase text-ink-mute',
                  gi === 0 ? 'px-3' : 'px-3 pt-1 border-t border-line'
                )}>
                  {group.label}
                </p>
              )}
              {!expanded && gi > 0 && <div className="h-px bg-line mx-1 mb-1" />}
              <div className="flex flex-col gap-0.5">
                {visibleItems.map(({ href, label, Icon }) => {
                  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={!expanded ? label : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-xl transition-colors',
                        expanded ? 'px-3 py-2.5' : 'p-2.5 justify-center',
                        active ? 'bg-primary text-paper **:text-paper' : 'text-ink-soft hover:bg-ink/4'
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
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <div className="h-px bg-line my-3 mx-1" />
        <div className={cn('flex items-center gap-3', expanded ? 'px-2.5 py-2' : 'p-2 justify-center')}>
          <Avatar name={userName || 'U'} size={32} tone="primary" />
          {expanded && (
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-ink font-medium truncate">{userName || 'Usuário'}</div>
              <div className="text-[10px] text-ink-soft truncate">{userEmail || ''}</div>
            </div>
          )}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            title="Sair"
            className={cn(
              'w-full flex items-center gap-2 rounded-xl transition-colors text-ink-soft hover:bg-ink/[0.04]',
              expanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'
            )}
          >
            <LogOut size={16} strokeWidth={1.5} />
            {expanded && <span className="text-[12px]">Sair</span>}
          </button>
        </form>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="mt-1 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-ink-soft hover:bg-ink/[0.04] text-[10px] tracking-[0.18em] uppercase"
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
