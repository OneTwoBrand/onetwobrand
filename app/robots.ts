import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://one2brand.com.br';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/loja', '/colecoes', '/produto', '/'],
        disallow: [
          '/checkout',
          '/carrinho',
          '/conta',
          '/api/',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
