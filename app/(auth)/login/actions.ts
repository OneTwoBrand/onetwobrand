'use server';

import { redirect } from 'next/navigation';
import { hasSupabasePublicEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

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

export async function sendPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    return;
  }

  if (!hasSupabasePublicEnv()) {
    return;
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: '/login',
  });
}
