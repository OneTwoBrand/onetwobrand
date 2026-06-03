/**
 * ONE TWO — App shell layout (sidebar + topbar/bottomnav)
 * Caminho: app/(app)/layout.tsx
 */
import { type ReactNode } from 'react';
import { Sidebar, BottomNav } from '@/components/layout/Navigation';
import { ToastProvider } from '@/components/ui/Overlays';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Usuário';

  const displayEmail = user?.email ?? '';

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg flex">
        <Sidebar expanded userName={displayName} userEmail={displayEmail} />
        <div className="flex-1 flex flex-col min-h-screen">
          {children}
          <footer className="pb-24 md:pb-6 pt-4 text-center">
            <span className="text-[10px] text-ink-soft tracking-[0.18em] uppercase">
              Desenvolvido por Girassol Inteligência para One Two Brand
            </span>
          </footer>
        </div>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
