import { getPlatformConfig } from '@/lib/platform-config';

const DEFAULT = 'Cada peça é produzida no atelier ONE TWO após o pedido confirmado.';

export async function DeliveryMessage() {
  const msg = await getPlatformConfig('shop_delivery_message');
  return <>{msg ?? DEFAULT}</>;
}
