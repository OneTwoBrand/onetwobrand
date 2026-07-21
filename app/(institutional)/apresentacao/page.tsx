import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { InstitutionalFanpage } from '@/components/institutional/InstitutionalFanpage';
import { getShopConfig } from '@/app/(app)/mais/shop-config-actions';
import { parseInstitutionalSlides, parsePublicSiteMode } from '@/lib/shop/institutional';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const config = await getShopConfig();
  return {
    title: config.shop_institutional_meta_title || config.shop_meta_title || 'ONE TWO · crafted pieces',
    description: config.shop_institutional_meta_description || config.shop_meta_description || 'Peças autorais feitas em pequenas tiragens.',
  };
}

export default async function ApresentacaoPage() {
  const config = await getShopConfig();
  if (parsePublicSiteMode(config.shop_public_mode) !== 'institutional') redirect('/loja');

  const whatsapp = config.shop_whatsapp?.replace(/\D/g, '');
  const instagram = config.shop_instagram?.trim();
  const instagramHref = instagram ? (instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace(/^@/, '')}`) : null;

  return <InstitutionalFanpage
    slides={parseInstitutionalSlides(config)}
    eyebrow={config.shop_institutional_eyebrow || 'ONE TWO · crafted pieces'}
    brandTitle={config.shop_institutional_brand_title || 'Peças com tempo, técnica e presença.'}
    intro={config.shop_institutional_intro || 'Enquanto a loja está sendo preparada, conheça o universo ONE TWO e fale diretamente com nosso atelier.'}
    interval={Number(config.shop_institutional_interval || 8)}
    instagramHref={instagramHref}
    whatsappHref={whatsapp ? `https://wa.me/55${whatsapp}` : null}
  />;
}
