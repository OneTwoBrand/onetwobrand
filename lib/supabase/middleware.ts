import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabasePublicEnv, hasSupabasePublicEnv } from '@/lib/env';

const PUBLIC_PATHS = [
  '/login', '/recuperar', '/nova-senha', '/manifest.webmanifest',
  '/apresentacao',
  // Loja pública — sem autenticação
  '/loja', '/produto', '/carrinho',
  '/checkout', '/conta',
  '/api/shop',
  '/sitemap.xml', '/robots.txt',
  // /colecoes mantido temporariamente para compatibilidade com redirects
  '/colecoes',
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-onetwo-pathname', request.nextUrl.pathname);
  const nextResponse = () => NextResponse.next({ request: { headers: requestHeaders } });
  let response = nextResponse();

  if (!hasSupabasePublicEnv()) {
    return response;
  }

  const { url, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = nextResponse();
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // refresh_token_not_found ou outro erro de auth — trata como anônimo
  }

  const { pathname } = request.nextUrl;

  // Visitante não logado na raiz → página pública, que resolve o modo ativo.
  if (!user && pathname === '/') {
    const lojaUrl = request.nextUrl.clone();
    lojaUrl.pathname = '/apresentacao';
    return NextResponse.redirect(lojaUrl);
  }

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === '/login') {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    return NextResponse.redirect(homeUrl);
  }

  return response;
}
