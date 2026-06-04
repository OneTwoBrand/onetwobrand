'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { setPlatformConfig, getPlatformConfig } from '@/lib/platform-config';

export type ShopConfigState = { error?: string; success?: string };

// ─── Auth guard helper ────────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase: null, user: null, error: 'Não autenticado.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') return { supabase: null, user: null, error: 'Acesso restrito ao administrador.' };

  return { supabase, user, error: null };
}

// ─── Save hero config ─────────────────────────────────────────────────────────
export async function saveHeroConfig(
  _prev: ShopConfigState,
  formData: FormData
): Promise<ShopConfigState> {
  const { user, error: authError } = await requireAdmin();
  if (authError || !user) return { error: authError ?? 'Não autenticado.' };

  const fields: Record<string, string> = {
    shop_hero_image_url: String(formData.get('shop_hero_image_url') ?? '').trim(),
    shop_hero_eyebrow:   String(formData.get('shop_hero_eyebrow') ?? '').trim(),
    shop_hero_title:     String(formData.get('shop_hero_title') ?? '').trim(),
    shop_hero_cta_label: String(formData.get('shop_hero_cta_label') ?? '').trim(),
    shop_hero_cta_href:  String(formData.get('shop_hero_cta_href') ?? '').trim(),
  };

  if (!fields.shop_hero_title) return { error: 'Título do hero é obrigatório.' };

  try {
    await Promise.all(
      Object.entries(fields)
        .filter(([, v]) => v !== '')
        .map(([k, v]) => setPlatformConfig(k, v, user.id))
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar.' };
  }

  revalidatePath('/loja');
  revalidatePath('/mais');
  return { success: 'Hero da vitrine atualizado.' };
}

// ─── Save store settings ──────────────────────────────────────────────────────
export async function saveStoreSettings(
  _prev: ShopConfigState,
  formData: FormData
): Promise<ShopConfigState> {
  const { user, error: authError } = await requireAdmin();
  if (authError || !user) return { error: authError ?? 'Não autenticado.' };

  const fields: Record<string, string> = {
    shop_free_shipping_above:    String(formData.get('shop_free_shipping_above') ?? '').trim(),
    shop_production_lead_time:   String(formData.get('shop_production_lead_time') ?? '').trim(),
    shop_delivery_message:       String(formData.get('shop_delivery_message') ?? '').trim(),
    shop_show_out_of_stock:      String(formData.get('shop_show_out_of_stock') ?? '').trim(),
    shop_whatsapp:               String(formData.get('shop_whatsapp') ?? '').trim(),
    shop_instagram:              String(formData.get('shop_instagram') ?? '').trim(),
    shop_reply_to_email:         String(formData.get('shop_reply_to_email') ?? '').trim(),
    shop_order_confirmation_msg: String(formData.get('shop_order_confirmation_msg') ?? '').trim(),
    shop_announcement_bar:       String(formData.get('shop_announcement_bar') ?? '').trim(),
    shop_meta_title:             String(formData.get('shop_meta_title') ?? '').trim(),
    shop_meta_description:       String(formData.get('shop_meta_description') ?? '').trim(),
  };

  try {
    await Promise.all(
      Object.entries(fields)
        .filter(([, v]) => v !== '')
        .map(([k, v]) => setPlatformConfig(k, v, user.id))
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar.' };
  }

  revalidatePath('/loja');
  revalidatePath('/mais');
  return { success: 'Configurações da loja atualizadas.' };
}

// ─── Read all shop config keys ────────────────────────────────────────────────
export async function getShopConfig(): Promise<Record<string, string>> {
  const keys = [
    'shop_hero_image_url',
    'shop_hero_eyebrow',
    'shop_hero_title',
    'shop_hero_cta_label',
    'shop_hero_cta_href',
    'shop_free_shipping_above',
    'shop_production_lead_time',
    'shop_delivery_message',
    'shop_show_out_of_stock',
    'shop_whatsapp',
    'shop_instagram',
    'shop_reply_to_email',
    'shop_order_confirmation_msg',
    'shop_announcement_bar',
    'shop_meta_title',
    'shop_meta_description',
  ];

  const entries = await Promise.all(
    keys.map(async (k) => [k, (await getPlatformConfig(k)) ?? ''] as [string, string])
  );

  return Object.fromEntries(entries);
}
