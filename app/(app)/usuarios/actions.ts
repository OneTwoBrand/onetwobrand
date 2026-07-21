'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertAdmin } from '@/lib/users-data';
import { sendInviteEmail, sendAccountStatusEmail } from '@/lib/email';
import { buildAuthConfirmationUrl } from '@/lib/auth-flow';

export type UserActionState = { error?: string; success?: string };

export async function inviteUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const fullName = String(formData.get('full_name') ?? '').trim();
  const role = String(formData.get('role') ?? 'atelier') as 'admin' | 'atelier' | 'viewer' | 'vendedora';

  if (!email || !fullName) return { error: 'Nome e e-mail são obrigatórios.' };
  if (!email.includes('@')) return { error: 'E-mail inválido.' };

  try {
    await assertAdmin();
    const admin = createAdminClient();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://one2brand.com.br';

    // Generate the invite token without asking Supabase to send its own email.
    // Resend is the single delivery channel for the branded invitation.
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('rate limit') || msg.includes('email rate')) {
        return {
          error:
            'Limite temporário do serviço de autenticação atingido. Aguarde alguns minutos e tente novamente.',
        };
      }
      return { error: error.message };
    }

    const tokenHash = data.properties?.hashed_token;
    if (!tokenHash || !data.user) {
      if (data.user) await admin.auth.admin.deleteUser(data.user.id);
      return { error: 'Não foi possível gerar um link válido para o convite.' };
    }
    const inviteLink = buildAuthConfirmationUrl(siteUrl, 'invite', tokenHash);

    // Set role in profiles after the invitation token is available.
    const { error: profileError } = await admin.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      role,
    }, { onConflict: 'id' });
    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return { error: `Não foi possível configurar o perfil: ${profileError.message}` };
    }

    const { error: emailError } = await sendInviteEmail({ to: email, fullName, role, inviteLink });
    if (emailError) {
      // Avoid leaving an account that the recipient cannot activate when the
      // delivery provider definitively rejects the message.
      await admin.auth.admin.deleteUser(data.user.id);
      return { error: `O convite não foi enviado: ${emailError.message}` };
    }

    revalidatePath('/usuarios');
    return { success: `Convite enviado para ${email}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao convidar usuário.' };
  }
}

export async function updateUserRole(userId: string, role: 'admin' | 'atelier' | 'viewer' | 'vendedora') {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ role }).eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/usuarios');
}

export async function toggleUserActive(userId: string, currentlyActive: boolean) {
  await assertAdmin();

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId) throw new Error('Você não pode desativar sua própria conta.');

  const admin = createAdminClient();

  // Fetch target user info for the notification email
  const { data: targetAuth } = await admin.auth.admin.getUserById(userId);
  const { data: targetProfile } = await admin.from('profiles').select('full_name').eq('id', userId).maybeSingle();

  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: currentlyActive ? '876600h' : 'none',
  });
  if (error) throw new Error(error.message);

  // Notify the affected user by email (non-fatal)
  if (targetAuth?.user?.email) {
    const fullName = targetProfile?.full_name ?? targetAuth.user.user_metadata?.full_name ?? 'Usuário';
    sendAccountStatusEmail({
      to: targetAuth.user.email,
      fullName,
      action: currentlyActive ? 'deactivated' : 'reactivated',
    }).catch(() => {});
  }

  revalidatePath('/usuarios');
}

export async function saveNavPermissions(userId: string, permissions: string[]) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ nav_permissions: permissions })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/usuarios');
}

export async function removeUser(userId: string) {
  await assertAdmin();

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId) throw new Error('Você não pode remover sua própria conta.');

  const admin = createAdminClient();

  // Fetch target user info before deletion
  const { data: targetAuth } = await admin.auth.admin.getUserById(userId);
  const { data: targetProfile } = await admin.from('profiles').select('full_name').eq('id', userId).maybeSingle();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  // Notify removed user by email (non-fatal, fire-and-forget)
  if (targetAuth?.user?.email) {
    const fullName = targetProfile?.full_name ?? targetAuth.user.user_metadata?.full_name ?? 'Usuário';
    sendAccountStatusEmail({
      to: targetAuth.user.email,
      fullName,
      action: 'removed',
    }).catch(() => {});
  }

  revalidatePath('/usuarios');
}
