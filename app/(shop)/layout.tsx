/**
 * ONE TWO · Layout público da loja
 * Envolve todas as rotas (shop): ShopHeader + ShopFooter + ShopNav.
 * Sem autenticação obrigatória.
 */
import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Overlays';
import { AnnouncementBar } from '@/components/shop/AnnouncementBar';
import { ShopHeader } from '@/components/shop/ShopHeader';
import { ShopFooter } from '@/components/shop/ShopFooter';
import { ShopNav } from '@/components/shop/ShopNav';

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg flex flex-col">
        <AnnouncementBar />
        <ShopHeader />
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-5 lg:px-14 pt-6 pb-6">
          {children}
        </main>
        <ShopFooter />
        <ShopNav />
      </div>
    </ToastProvider>
  );
}
