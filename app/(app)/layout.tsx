/**
 * ONE TWO — App shell layout (sidebar + topbar/bottomnav)
 * Caminho: app/(app)/layout.tsx
 */
import { type ReactNode } from 'react';
import { Sidebar, BottomNav } from '@/components/layout/Navigation';
import { ToastProvider } from '@/components/ui/Overlays';
import { getCurrentUserDisplay } from '@/lib/current-user';
import { createClient } from '@/lib/supabase/server';
import { parseNavPermissions, type NavHref } from '@/lib/nav-permissions';

async function getUserProfile(userId: string): Promise<{ role: string; navPermissions: NavHref[] | null }> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('profiles')
      .select('role, nav_permissions')
      .eq('id', userId)
      .maybeSingle();

    const role = data?.role ?? 'atelier';
    // Admin always gets null (= unrestricted); non-admins get parsed list
    const navPermissions = role === 'admin' ? null : parseNavPermissions(data?.nav_permissions);
    return { role, navPermissions };
  } catch {
    return { role: 'atelier', navPermissions: null };
  }
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const [user, { data: { user: authUser } }] = await Promise.all([
    getCurrentUserDisplay(),
    supabase.auth.getUser(),
  ]);
  const { role, navPermissions } = authUser
    ? await getUserProfile(authUser.id)
    : { role: 'atelier', navPermissions: null };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg flex">
        <Sidebar
          expanded
          userName={user.name}
          userEmail={user.email}
          userRole={role}
          navPermissions={navPermissions}
        />
        <div className="flex-1 flex flex-col min-h-screen">
          {children}
          <footer className="pb-24 md:pb-6 pt-4 text-center">
            <span className="text-[10px] text-ink-soft tracking-[0.18em] uppercase">
              Plataforma oficial One Two Brand
            </span>
          </footer>
        </div>
        <BottomNav userRole={role} navPermissions={navPermissions} />
      </div>
    </ToastProvider>
  );
}
