/**
 * ONE TWO · Sitemap dinâmico
 * Gerado a partir do Supabase: produtos e coleções publicadas.
 * Exclui rotas privadas (checkout, conta, carrinho, APIs).
 */
import type { MetadataRoute } from 'next';
import { getAllProductSlugs, getAllCollectionSlugs } from '@/lib/shop/catalog';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://one2brand.com.br';

export const revalidate = 3600; // regenera a cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [productSlugs, collectionSlugs] = await Promise.all([
    getAllProductSlugs(),
    getAllCollectionSlugs(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,         lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE}/loja`,     lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/colecoes`, lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
  ];

  const collectionRoutes: MetadataRoute.Sitemap = collectionSlugs.map((slug) => ({
    url:             `${BASE}/colecoes/${slug}`,
    lastModified:    now,
    changeFrequency: 'weekly' as const,
    priority:        0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url:             `${BASE}/produto/${slug}`,
    lastModified:    now,
    changeFrequency: 'daily' as const,
    priority:        0.9,
  }));

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}
