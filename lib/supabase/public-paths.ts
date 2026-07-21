import { AUTH_CALLBACK_PATH } from '../auth-flow';

const PUBLIC_PATHS = [
  '/login', '/recuperar', '/nova-senha', AUTH_CALLBACK_PATH, '/manifest.webmanifest',
  '/apresentacao',
  // Loja pública — sem autenticação
  '/loja', '/produto', '/carrinho',
  '/checkout', '/conta',
  '/api/shop',
  '/sitemap.xml', '/robots.txt',
  // /colecoes mantido temporariamente para compatibilidade com redirects
  '/colecoes',
];

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
