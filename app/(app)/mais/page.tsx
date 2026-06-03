import Link from 'next/link';
import {
  BarChart3, Bot, CircleDollarSign, Gem, KeyRound, LogOut,
  Package, Scissors, Settings, Shield, User, Users, SlidersHorizontal,
} from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Avatar, Card, Divider, SectionHead } from '@/components/ui/Primitives';
import { Badge } from '@/components/ui/Badge';
import { getCurrentUserDisplay } from '@/lib/current-user';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/(auth)/logout/actions';
import { checkOpenAIConfigured } from './actions';
import { ProfileForm, PasswordForm, AdminAIConfigForm } from './ProfileForm';
import { getWorkflowConfig } from '@/lib/workflow-config';
import {
  OpStatusesForm,
  ProductionStepsForm,
  PaymentMethodsForm,
  SeamstressRolesForm,
  ProductSizesForm,
  ProductFabricsForm,
  ProductCategoriesForm,
  ProductColorsForm,
} from './WorkflowConfigForms';

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
  { href: '/', label: 'Início', icon: <BarChart3 size={18} strokeWidth={1.5} /> },
  { href: '/producao', label: 'Produção', icon: <Scissors size={18} strokeWidth={1.5} /> },
  { href: '/bordagem', label: 'Bordagem', icon: <Gem size={18} strokeWidth={1.5} /> },
  { href: '/estoque', label: 'Estoque', icon: <Package size={18} strokeWidth={1.5} /> },
  { href: '/clientes', label: 'Clientes', icon: <User size={18} strokeWidth={1.5} /> },
  { href: '/costureiras', label: 'Costureiras', icon: <Users size={18} strokeWidth={1.5} /> },
  { href: '/financeiro', label: 'Financeiro', icon: <CircleDollarSign size={18} strokeWidth={1.5} /> },
  { href: '/relatorios', label: 'Relatórios', icon: <BarChart3 size={18} strokeWidth={1.5} /> },
  { href: '/assistant', label: 'OneTwo Assistant', icon: <Bot size={18} strokeWidth={1.5} /> },
];

export default async function MaisPage() {
  const supabase = await createClient();
  const [user, { data: { user: authUser } }] = await Promise.all([
    getCurrentUserDisplay(),
    supabase.auth.getUser(),
  ]);

  const role = authUser ? await getProfileRole(authUser.id) : 'admin';
  const isAdmin = role === 'admin';
  const [aiConfigured, workflowConfig] = await Promise.all([
    isAdmin ? checkOpenAIConfigured() : Promise.resolve(false),
    isAdmin ? getWorkflowConfig() : Promise.resolve(null),
  ]);

  const roleLabel: Record<string, string> = {
    admin: 'Admin', atelier: 'Atelier', viewer: 'Visualizador',
  };

  return (
    <>
      <AppBar large eyebrow="Mais" title="Configurações" />
      <Topbar eyebrow="Mais" title="Configurações" action={<Settings size={18} className="text-ink-soft" />} />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-xl space-y-6">

          {/* Perfil do usuário */}
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

          {/* Segurança */}
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
            <SectionHead eyebrow="Acesso" title="Alterar senha" />
            <div className="mt-3">
              <PasswordForm />
            </div>
          </Card>

          {/* Navegação rápida — útil no mobile */}
          <div className="md:hidden">
            <SectionHead eyebrow="Atalhos" title="Módulos" />
            <Card pad={0}>
              {NAV_LINKS.map((item, i) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-5 py-4 hover:bg-surface transition-colors"
                  >
                    <span className="text-primary">{item.icon}</span>
                    <span className="text-[14px] text-ink">{item.label}</span>
                  </Link>
                  {i < NAV_LINKS.length - 1 && <Divider />}
                </div>
              ))}
            </Card>
          </div>

          {/* Admin — Integração IA */}
          {isAdmin && (
            <Card pad={20}>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                  <Bot size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-ink">Integração IA — OneTwo Assistant</p>
                  <p className="text-[11px] text-ink-soft">Restrito ao administrador de TI</p>
                </div>
              </div>
              <Divider className="mb-5" />
              <SectionHead eyebrow="OpenAI" title="Chave de API" />
              <div className="mt-3">
                <AdminAIConfigForm isConfigured={aiConfigured} />
              </div>
            </Card>
          )}

          {/* Admin — Fluxo de trabalho */}
          {isAdmin && workflowConfig && (
            <Card pad={20}>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                  <SlidersHorizontal size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-ink">Configurações de fluxo</p>
                  <p className="text-[11px] text-ink-soft">Restrito ao administrador</p>
                </div>
              </div>
              <Divider className="mb-5" />
              <div className="space-y-8">
                <OpStatusesForm config={workflowConfig} />
                <Divider />
                <ProductionStepsForm config={workflowConfig} />
                <Divider />
                <PaymentMethodsForm config={workflowConfig} />
                <Divider />
                <SeamstressRolesForm config={workflowConfig} />
              </div>
            </Card>
          )}

          {/* Admin — Catálogo de produtos */}
          {isAdmin && workflowConfig && (
            <Card pad={20}>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                  <Package size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-ink">Catálogo de produtos</p>
                  <p className="text-[11px] text-ink-soft">Opções dos campos no cadastro de estoque</p>
                </div>
              </div>
              <Divider className="mb-5" />
              <div className="space-y-8">
                <ProductSizesForm config={workflowConfig} />
                <Divider />
                <ProductFabricsForm config={workflowConfig} />
                <Divider />
                <ProductCategoriesForm config={workflowConfig} />
                <Divider />
                <ProductColorsForm config={workflowConfig} />
              </div>
            </Card>
          )}

          {/* Sair */}
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

          {/* Rodapé */}
          <p className="text-center text-[10px] text-ink-soft tracking-[0.16em] uppercase">
            v1.0 · Desenvolvido por Girassol Inteligência
          </p>

        </section>
      </main>
    </>
  );
}
