/**
 * ONE TWO · Layout público da loja
 * Envolve todas as rotas (shop): ShopHeader + ShopFooter + ShopNav.
 * Sem autenticação obrigatória.
 */
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Overlays';
import { AnnouncementBar } from '@/components/shop/AnnouncementBar';
import { ShopHeader } from '@/components/shop/ShopHeader';
import { ShopFooter } from '@/components/shop/ShopFooter';
import { ShopNav } from '@/components/shop/ShopNav';
import { getPlatformConfig } from '@/lib/platform-config';
import { parsePublicSiteMode } from '@/lib/shop/institutional';

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const [cartFlag, publicMode, requestHeaders] = await Promise.all([
    getPlatformConfig('shop_enable_cart'),
    getPlatformConfig('shop_public_mode'),
    headers(),
  ]);
  const pathname = requestHeaders.get('x-onetwo-pathname') ?? '';
  const allowsCustomerArea = pathname.startsWith('/conta');
  if (parsePublicSiteMode(publicMode) === 'institutional' && !allowsCustomerArea) {
    redirect('/apresentacao');
  }
  const showCart = cartFlag === 'true';

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg flex flex-col">
        <AnnouncementBar />
        <ShopHeader showCart={showCart} />
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-5 lg:px-14 pt-6 pb-6">
          {children}
        </main>
        <ShopFooter />
        <ShopNav showCart={showCart} />
      </div>
    </ToastProvider>
  );
}
