'use server';

import { redirect } from 'next/navigation';
import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPasswordResetEmail } from '@/lib/email';

export type LoginActionState = {
  error?: string;
};

export async function signInWithPassword(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Informe e-mail e senha.' };
  }

  if (!hasSupabasePublicEnv()) {
    return { error: 'Supabase ainda nao foi configurado neste ambiente.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Credenciais inválidas ou usuário não autorizado.' };
  }

  redirect('/');
}

export type ResetActionState = { error?: string; success?: string };

export async function sendPasswordReset(
  _prev: ResetActionState,
  formData: FormData
): Promise<ResetActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  if (!email) return { error: 'Informe seu e-mail.' };
  if (!hasSupabasePublicEnv()) return { error: 'Configuração indisponível.' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://one2brand.com.br';
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${siteUrl}/auth/callback?next=/nova-senha` },
    });
    if (!error && data.properties?.action_link) {
      await sendPasswordResetEmail({ to: email, resetLink: data.properties.action_link });
    }
  } catch (error) {
    console.error('[password-reset]', error instanceof Error ? error.message : error);
  }

  return { success: 'Se este e-mail estiver cadastrado, você receberá um link em instantes.' };
}

export type NewPasswordActionState = { error?: string; success?: string };

export async function updatePasswordFromReset(
  _prev: NewPasswordActionState,
  formData: FormData
): Promise<NewPasswordActionState> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (!password || password.length < 6) return { error: 'A senha deve ter ao menos 6 caracteres.' };
  if (password !== confirm) return { error: 'As senhas não coincidem.' };

  if (!hasSupabasePublicEnv()) return { error: 'Configuração indisponível.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: 'Não foi possível atualizar a senha. O link pode ter expirado.' };

  return { success: 'Senha atualizada com sucesso!' };
}
