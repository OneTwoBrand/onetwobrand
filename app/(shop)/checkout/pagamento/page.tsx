import { getPlatformConfig } from '@/lib/platform-config';
import { PagamentoClient } from './PagamentoClient';

export const dynamic = 'force-dynamic';

export default async function PagamentoPage() {
  const [waFlag, waNumber] = await Promise.all([
    getPlatformConfig('shop_enable_whatsapp_button'),
    getPlatformConfig('shop_whatsapp'),
  ]);

  // Quando WhatsApp está ligado, o checkout é exclusivamente por WhatsApp.
  const waEnabled = waFlag === 'true' && !!waNumber;

  return (
    <PagamentoClient
      waEnabled={waEnabled}
      waNumber={waNumber ?? null}
    />
  );
}
