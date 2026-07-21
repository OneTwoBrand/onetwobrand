import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabasePublicEnv } from '@/lib/env';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const requestedNext = searchParams.get('next') ?? '/';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//')
    ? requestedNext
    : '/';

  const redirectTo = new URL(next, origin);

  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      redirectTo.pathname = '/login';
      redirectTo.searchParams.set('error', 'link_invalido');
      return NextResponse.redirect(redirectTo);
    }
    return NextResponse.redirect(redirectTo);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'invite' | 'recovery' | 'email' });
    if (error) {
      redirectTo.pathname = '/login';
      redirectTo.searchParams.set('error', 'link_invalido');
      return NextResponse.redirect(redirectTo);
    }
    return NextResponse.redirect(redirectTo);
  }

  redirectTo.pathname = '/login';
  return NextResponse.redirect(redirectTo);
}
