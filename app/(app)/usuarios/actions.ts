'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertAdmin } from '@/lib/users-data';

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

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://one2brand.com.br'}/login`,
    });

    if (error) return { error: error.message };

    // Set role in profiles (trigger creates the row, we update the role)
    await admin.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      role,
    }, { onConflict: 'id' });

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

  // Prevent self-deactivation
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId) throw new Error('Você não pode desativar sua própria conta.');

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: currentlyActive ? '876600h' : 'none',
  });
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
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath('/usuarios');
}
