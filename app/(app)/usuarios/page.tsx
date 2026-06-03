import Link from 'next/link';
import { Plus, UserCheck, UserX } from 'lucide-react';
import { redirect } from 'next/navigation';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar, Card, SectionHead } from '@/components/ui/Primitives';
import { listUsers, ROLE_LABEL, ROLE_TONE } from '@/lib/users-data';
import { createClient } from '@/lib/supabase/server';
import { RoleSelector, UserMenu, NavPermissionsPanel } from './UserActions';

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getCurrentRole(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return '';
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return data?.role ?? '';
}

export default async function UsuariosPage() {
  const role = await getCurrentRole();
  if (role !== 'admin') redirect('/');

  const [{ users, error }, currentUserId] = await Promise.all([
    listUsers(),
    getCurrentUserId(),
  ]);

  const active = users.filter((u) => u.active);
  const inactive = users.filter((u) => !u.active);

  const newButton = (
    <Link href="/usuarios/novo">
      <Button size="sm" icon={<Plus size={14} />}>Convidar</Button>
    </Link>
  );

  return (
    <>
      <AppBar large eyebrow="Administração" title={`${users.length} usuários`} action={<Link href="/usuarios/novo"><Button size="sm" icon={<Plus size={14} />}>Novo</Button></Link>} />
      <Topbar eyebrow="Administração" title={`${users.length} usuários`} action={newButton} />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-4xl space-y-6">

          {error && (
            <Card pad={16}>
              <p className="text-[12px] text-danger">{error}</p>
            </Card>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <Card pad={16}>
              <p className="font-serif text-[28px] leading-none text-ink">{users.length}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Total</p>
            </Card>
            <Card pad={16}>
              <p className="font-serif text-[28px] leading-none text-ink">{active.length}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Ativos</p>
            </Card>
            <Card pad={16}>
              <p className="font-serif text-[28px] leading-none text-ink">{inactive.length}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Inativos</p>
            </Card>
          </div>

          {/* Active users */}
          <div>
            <SectionHead eyebrow="Acesso liberado" title="Usuários ativos" />
            <div className="space-y-3">
              {active.map((user) => (
                <Card key={user.id} pad={16}>
                  <div className="flex items-center gap-3">
                    <Avatar name={user.fullName} tone={user.id === currentUserId ? 'primary' : 'neutral'} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif text-[17px] text-ink">{user.fullName}</span>
                        {user.id === currentUserId && (
                          <Badge tone="primary" size="sm">Você</Badge>
                        )}
                        <Badge tone={ROLE_TONE[user.role] ?? 'neutral'} size="sm">
                          {ROLE_LABEL[user.role] ?? user.role}
                        </Badge>
                        <UserCheck size={13} className="text-success" />
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-soft truncate">{user.email}</p>
                      <p className="mt-0.5 text-[10px] text-ink-soft">
                        {user.lastSignIn ? `Último acesso: ${user.lastSignIn}` : 'Nunca acessou'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {user.id !== currentUserId && (
                        <RoleSelector userId={user.id} currentRole={user.role} />
                      )}
                      <UserMenu userId={user.id} active={user.active} isSelf={user.id === currentUserId} />
                    </div>
                  </div>
                  {user.id !== currentUserId && (
                    <NavPermissionsPanel
                      userId={user.id}
                      currentRole={user.role}
                      navPermissions={user.navPermissions}
                    />
                  )}
                </Card>
              ))}
              {active.length === 0 && (
                <Card pad={18}><p className="text-[13px] text-ink-soft">Nenhum usuário ativo.</p></Card>
              )}
            </div>
          </div>

          {/* Inactive users */}
          {inactive.length > 0 && (
            <div>
              <SectionHead eyebrow="Acesso bloqueado" title="Usuários inativos" />
              <div className="space-y-3">
                {inactive.map((user) => (
                  <Card key={user.id} pad={16} className="opacity-60">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.fullName} tone="neutral" size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-serif text-[17px] text-ink">{user.fullName}</span>
                          <Badge tone="danger" size="sm">Inativo</Badge>
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink-soft truncate">{user.email}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <UserX size={15} className="text-danger" />
                        <UserMenu userId={user.id} active={user.active} isSelf={false} />
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
          )}

        </section>
      </main>
    </>
  );
}
