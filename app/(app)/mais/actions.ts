'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { setPlatformConfig, getPlatformConfig } from '@/lib/platform-config';

export type ProfileActionState = { error?: string; success?: string };

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const fullName = String(formData.get('full_name') ?? '').trim();
  if (!fullName) return { error: 'Nome é obrigatório.' };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Não autenticado.' };

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id);

  if (profileError) return { error: profileError.message };

  await supabase.auth.updateUser({ data: { full_name: fullName } });

  revalidatePath('/mais');
  revalidatePath('/');
  return { success: 'Perfil atualizado com sucesso.' };
}

export async function updatePassword(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const current = String(formData.get('current_password') ?? '');
  const next = String(formData.get('new_password') ?? '');
  const confirm = String(formData.get('confirm_password') ?? '');

  if (!current || !next || !confirm) return { error: 'Preencha todos os campos.' };
  if (next.length < 8) return { error: 'Nova senha deve ter ao menos 8 caracteres.' };
  if (next !== confirm) return { error: 'Nova senha e confirmação não coincidem.' };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || !user.email) return { error: 'Não autenticado.' };

  // Verify current password by attempting sign-in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (signInError) return { error: 'Senha atual incorreta.' };

  const { error: updateError } = await supabase.auth.updateUser({ password: next });
  if (updateError) return { error: updateError.message };

  return { success: 'Senha alterada com sucesso.' };
}

export async function saveOpenAIKey(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const apiKey = String(formData.get('openai_api_key') ?? '').trim();
  if (!apiKey) return { error: 'Chave não pode estar vazia.' };
  if (!apiKey.startsWith('sk-')) return { error: 'Chave inválida. Deve começar com sk-.' };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Não autenticado.' };

  // Only admins
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') return { error: 'Acesso restrito ao administrador.' };

  // Validate key with a minimal OpenAI call
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return { error: 'Chave OpenAI inválida ou sem permissão.' };
  } catch {
    return { error: 'Não foi possível validar a chave. Verifique a conexão.' };
  }

  await setPlatformConfig('openai_api_key', apiKey, user.id);
  revalidatePath('/mais');
  return { success: 'Chave OpenAI salva e validada com sucesso.' };
}

export async function checkOpenAIConfigured(): Promise<boolean> {
  if (process.env.OPENAI_API_KEY) return true;
  const key = await getPlatformConfig('openai_api_key');
  return Boolean(key);
}
