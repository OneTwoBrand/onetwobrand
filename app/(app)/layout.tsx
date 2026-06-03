/**
 * ONE TWO — App shell layout (sidebar + topbar/bottomnav)
 * Caminho: app/(app)/layout.tsx
 */
import { type ReactNode } from 'react';
import { Sidebar, BottomNav } from '@/components/layout/Navigation';
import { ToastProvider } from '@/components/ui/Overlays';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg flex">
        <Sidebar expanded />
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
