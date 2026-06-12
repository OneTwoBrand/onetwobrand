import { getPlatformConfig } from '@/lib/platform-config';
import { PagamentoClient } from './PagamentoClient';

export const dynamic = 'force-dynamic';

export default async function PagamentoPage() {
  const [cartFlag, waFlag, waNumber] = await Promise.all([
    getPlatformConfig('shop_enable_cart'),
    getPlatformConfig('shop_enable_whatsapp_button'),
    getPlatformConfig('shop_whatsapp'),
  ]);

  return (
    <PagamentoClient
      cartEnabled={cartFlag === 'true'}
      waEnabled={waFlag === 'true' && !!waNumber}
      waNumber={waNumber ?? null}
    />
  );
}
