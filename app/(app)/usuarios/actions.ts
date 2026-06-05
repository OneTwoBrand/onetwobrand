'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertAdmin } from '@/lib/users-data';
import { sendInviteEmail, sendAccountStatusEmail } from '@/lib/email';

export type UserActionState = { error?: string; success?: string };

export async function inviteUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const fullName = String(formData.get('full_name') ?? '').trim();
  const role = String(formData.get('role') ?? 'atelier') as 'admin' | 'atelier' | 'viewer';

  if (!email || !fullName) return { error: 'Nome e e-mail são obrigatórios.' };
  if (!email.includes('@')) return { error: 'E-mail inválido.' };

  try {
    await assertAdmin();
    const admin = createAdminClient();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://one2brand.com.br';

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${siteUrl}/auth/callback?next=/nova-senha`,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('rate limit') || msg.includes('email rate')) {
        return {
          error:
            'Limite de e-mails do Supabase atingido (2–3/hora no plano gratuito). ' +
            'Aguarde alguns minutos e tente novamente, ou configure um SMTP próprio em ' +
            'Authentication → Settings → SMTP no painel do Supabase.',
        };
      }
      return { error: error.message };
    }

    // Set role in profiles (trigger creates the row, we update the role)
    await admin.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      role,
    }, { onConflict: 'id' });

    // Build the invite link from the Supabase action link so Resend sends
    // the real token (not just /login). action_link is the full URL with token.
    const inviteLink = (data.user as { action_link?: string }).action_link
      ?? `${siteUrl}/auth/callback?next=/nova-senha`;

    await sendInviteEmail({ to: email, fullName, role, inviteLink }).catch(() => {});

    revalidatePath('/usuarios');
    return { success: `Convite enviado para ${email}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao convidar usuário.' };
  }
}

export async function updateUserRole(userId: string, role: 'admin' | 'atelier' | 'viewer') {
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
