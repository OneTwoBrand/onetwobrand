import Link from 'next/link';
import {
  BarChart3, Bot, ChevronRight, CircleDollarSign, CreditCard,
  Gem, LogOut, Package, Scissors, Settings, Shield, Store, User, Users,
} from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Avatar, Card, Divider, SectionHead } from '@/components/ui/Primitives';
import { Badge } from '@/components/ui/Badge';
import { getCurrentUserDisplay } from '@/lib/current-user';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/(auth)/logout/actions';
import { ProfileForm, PasswordForm } from './ProfileForm';

async function getProfileRole(userId: string): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    return data?.role ?? 'admin';
  } catch {
    return 'admin';
  }
}

const NAV_LINKS = [
  { href: '/',          label: 'Início',           icon: <BarChart3 size={18} strokeWidth={1.5} /> },
  { href: '/producao',  label: 'Produção',          icon: <Scissors size={18} strokeWidth={1.5} /> },
  { href: '/bordagem',  label: 'Bordagem',          icon: <Gem size={18} strokeWidth={1.5} /> },
  { href: '/estoque',   label: 'Estoque',           icon: <Package size={18} strokeWidth={1.5} /> },
  { href: '/clientes',  label: 'Clientes',          icon: <User size={18} strokeWidth={1.5} /> },
  { href: '/costureiras', label: 'Costureiras',     icon: <Users size={18} strokeWidth={1.5} /> },
  { href: '/financeiro', label: 'Financeiro',       icon: <CircleDollarSign size={18} strokeWidth={1.5} /> },
  { href: '/relatorios', label: 'Relatórios',       icon: <BarChart3 size={18} strokeWidth={1.5} /> },
  { href: '/assistant',  label: 'OneTwo Assistente', icon: <Bot size={18} strokeWidth={1.5} /> },
];

type NavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
};

function NavCard({ items }: { items: NavItem[] }) {
  return (
    <Card pad={0}>
      {items.map((item, i) => (
        <div key={item.href}>
          <Link
            href={item.href}
            className="flex items-center gap-4 px-5 py-4 hover:bg-surface transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-ink">{item.label}</p>
              <p className="text-[11px] text-ink-soft mt-0.5">{item.desc}</p>
            </div>
            <ChevronRight size={16} className="text-ink-mute shrink-0" />
          </Link>
          {i < items.length - 1 && <Divider />}
        </div>
      ))}
    </Card>
  );
}

export default async function MaisPage() {
  const supabase = await createClient();
  const [user, { data: { user: authUser } }] = await Promise.all([
    getCurrentUserDisplay(),
    supabase.auth.getUser(),
  ]);

  const role = authUser ? await getProfileRole(authUser.id) : 'admin';
  const isAdmin = role === 'admin';

  const roleLabel: Record<string, string> = {
    admin: 'Admin', atelier: 'Atelier', viewer: 'Visualizador',
  };

  const operacionalItems: NavItem[] = [
    { href: '/mais/atelier',    icon: <Scissors size={18} strokeWidth={1.5} />, label: 'Atelier',    desc: 'Status de OP, etapas de produção e funções' },
    { href: '/mais/catalogo',   icon: <Package  size={18} strokeWidth={1.5} />, label: 'Catálogo',   desc: 'Tamanhos, tecidos, categorias e cores' },
    { href: '/mais/financeiro', icon: <CircleDollarSign size={18} strokeWidth={1.5} />, label: 'Financeiro', desc: 'Fornecedores, categorias e lançamentos' },
    { href: '/mais/pagamentos', icon: <CreditCard size={18} strokeWidth={1.5} />, label: 'Pagamentos', desc: 'Métodos de pagamento aceitos' },
  ];

  const adminItems: NavItem[] = [
    { href: '/mais/loja',    icon: <Store    size={18} strokeWidth={1.5} />, label: 'Loja',    desc: 'Vitrine, frete, comunicação e SEO' },
    { href: '/mais/sistema', icon: <Settings size={18} strokeWidth={1.5} />, label: 'Sistema', desc: 'Integração IA e configurações técnicas' },
  ];

  return (
    <>
      <AppBar large eyebrow="Mais" title="Configurações" />
      <Topbar eyebrow="Mais" title="Configurações" action={<Settings size={18} className="text-ink-soft" />} />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-xl space-y-6">

          {/* ── Perfil ────────────────────────────────────── */}
          <Card pad={20}>
            <div className="mb-5 flex items-center gap-4">
              <Avatar name={user.name} size={52} tone="primary" />
              <div>
                <h2 className="m-0 font-serif text-[22px] font-normal text-ink">{user.name}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-[12px] text-ink-soft">{user.email}</p>
                  <Badge tone="primary" size="sm">{roleLabel[role] ?? role}</Badge>
                </div>
              </div>
            </div>
            <Divider className="mb-5" />
            <SectionHead eyebrow="Dados" title="Editar nome" />
            <div className="mt-3">
              <ProfileForm currentName={user.name} />
            </div>
          </Card>

          {/* ── Segurança ─────────────────────────────────── */}
          <Card pad={20}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                <Shield size={18} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-ink">Segurança</p>
                <p className="text-[11px] text-ink-soft">Altere sua senha de acesso</p>
              </div>
            </div>
            <Divider className="mb-5" />
            <PasswordForm />
          </Card>

          {/* ── Navegação rápida mobile ────────────────────── */}
          <div className="md:hidden">
            <SectionHead eyebrow="Atalhos" title="Módulos" />
            <Card pad={0}>
              {NAV_LINKS.map((item, i) => (
                <div key={item.href}>
                  <Link href={item.href} className="flex items-center gap-3 px-5 py-4 hover:bg-surface transition-colors">
                    <span className="text-primary">{item.icon}</span>
                    <span className="text-[14px] text-ink">{item.label}</span>
                  </Link>
                  {i < NAV_LINKS.length - 1 && <Divider />}
                </div>
              ))}
            </Card>
          </div>

          {/* ── Operacional ───────────────────────────────── */}
          <div>
            <SectionHead eyebrow="Operacional" title="Configurações do atelier" className="mb-3" />
            <NavCard items={operacionalItems} />
          </div>

          {/* ── Administração TI ──────────────────────────── */}
          {isAdmin && (
            <div>
              <SectionHead eyebrow="Administração" title="Configurações técnicas" className="mb-3" />
              <NavCard items={adminItems} />
            </div>
          )}

          {/* ── Sair ──────────────────────────────────────── */}
          <Card pad={20}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-danger-soft text-danger">
                <LogOut size={18} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-ink">Sair da conta</p>
                <p className="text-[11px] text-ink-soft">Encerra a sessão atual</p>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full border border-danger px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-danger transition-colors hover:bg-danger-soft"
                >
                  Sair
                </button>
              </form>
            </div>
          </Card>

          <p className="text-center text-[10px] text-ink-soft tracking-[0.16em] uppercase">
            Desenvolvido por Girassol Inteligência para OneTwoBrand
          </p>

        </section>
      </main>
    </>
  );
}
