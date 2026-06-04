import { getPlatformConfig } from '@/lib/platform-config';

/**
 * Barra de anúncio no topo da loja.
 * Renderiza apenas se shop_announcement_bar estiver configurado.
 * Server Component — sem JS no cliente.
 */
export async function AnnouncementBar() {
  const text = await getPlatformConfig('shop_announcement_bar');
  if (!text) return null;

  return (
    <div className="w-full bg-ink text-paper text-center py-2 px-4">
      <p className="text-[11px] font-medium tracking-[0.16em] uppercase">{text}</p>
    </div>
  );
}
