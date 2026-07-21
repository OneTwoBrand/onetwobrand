'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { parsePasswordFlow } from '@/lib/auth-flow';

export function ImplicitSessionBridge() {
  const router = useRouter();

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    if (!accessToken || !refreshToken) return;

    const flow = parsePasswordFlow(hash.get('type')) ?? 'invite';
    const supabase = createClient();

    void supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        router.replace(error ? '/nova-senha?error=link_invalido' : `/nova-senha?flow=${flow}`);
        router.refresh();
      });
  }, [router]);

  return null;
}
