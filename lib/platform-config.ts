import { createClient } from '@/lib/supabase/server';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

// Derives a 32-byte key from the ENCRYPTION_SECRET env var
function getDerivedKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) throw new Error('ENCRYPTION_SECRET não configurada.');
  return createHash('sha256').update(secret).digest();
}

export function encrypt(plaintext: string): string {
  const key = getDerivedKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(ciphertext: string): string {
  const key = getDerivedKey();
  const [ivHex, encHex] = ciphertext.split(':');
  if (!ivHex || !encHex) throw new Error('Formato de ciphertext inválido.');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export async function getPlatformConfig(key: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('platform_config')
      .select('value_enc')
      .eq('key', key)
      .maybeSingle();
    if (error || !data) return null;
    return decrypt(data.value_enc);
  } catch {
    return null;
  }
}

export async function setPlatformConfig(key: string, value: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const value_enc = encrypt(value);
  const { error } = await supabase
    .from('platform_config')
    .upsert({ key, value_enc, updated_at: new Date().toISOString(), updated_by: userId }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
}

export async function getOpenAIKey(): Promise<string | null> {
  // Prefer env var (set by TI admin in Vercel) over DB for performance
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  return getPlatformConfig('openai_api_key');
}
