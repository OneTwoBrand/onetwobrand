import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type PlatformUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'atelier' | 'viewer';
  active: boolean;
  lastSignIn: string | null;
  createdAt: string;
  navPermissions: string[] | null;
};

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  atelier: 'Atelier',
  viewer: 'Visualizador',
};

export const ROLE_TONE: Record<string, 'primary' | 'secondary' | 'neutral'> = {
  admin: 'primary',
  atelier: 'secondary',
  viewer: 'neutral',
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
}

export async function assertAdmin(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') throw new Error('Acesso restrito ao administrador.');
}

export async function listUsers(): Promise<{ users: PlatformUser[]; error?: string }> {
  try {
    await assertAdmin();
    const admin = createAdminClient();

    const [{ data: authData, error: authError }, { data: profiles, error: profilesError }] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 200 }),
      admin.from('profiles').select('id, full_name, role, nav_permissions'),
    ]);

    if (authError || profilesError) {
      return { users: [], error: authError?.message ?? profilesError?.message };
    }

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const users: PlatformUser[] = (authData?.users ?? []).map((u) => {
      const profile = profileMap.get(u.id);
      const isBanned = u.banned_until ? new Date(u.banned_until) > new Date() : false;
      return {
        id: u.id,
        fullName: profile?.full_name ?? u.user_metadata?.full_name ?? u.email?.split('@')[0] ?? 'Usuário',
        email: u.email ?? '',
        role: (profile?.role ?? 'atelier') as PlatformUser['role'],
        active: !isBanned,
        lastSignIn: formatDate(u.last_sign_in_at ?? null),
        createdAt: formatDate(u.created_at) ?? '',
        navPermissions: Array.isArray(profile?.nav_permissions) ? profile.nav_permissions as string[] : null,
      };
    });

    return { users: users.sort((a, b) => a.fullName.localeCompare(b.fullName)) };
  } catch (e) {
    return { users: [], error: e instanceof Error ? e.message : 'Erro ao listar usuários.' };
  }
}
