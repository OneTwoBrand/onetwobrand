import 'server-only';

import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export async function checkServerRateLimit(
  scope: string,
  identity: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const secret = process.env.ENCRYPTION_SECRET ?? process.env.SHOP_SESSION_SECRET;
  if (!secret || secret.length < 32) return false;
  const keyHash = createHash('sha256').update(`${secret}:${scope}:${identity}`).digest('hex');
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('check_api_rate_limit', {
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  return !error && data === true;
}
