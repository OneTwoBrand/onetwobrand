import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv } from '@/lib/env';

// Uses the Service Role key — NEVER call this from client components
export function createAdminClient() {
  const { url } = getSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada.');
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
