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
        </div>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
