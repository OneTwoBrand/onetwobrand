'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { setWorkflowConfig } from '@/lib/workflow-config';

type State = { error?: string; success?: string };

async function getAdminUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Não autenticado.');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') throw new Error('Acesso restrito ao administrador.');
  return user.id;
}

function parseLines(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function saveOpStatuses(_prev: State, formData: FormData): Promise<State> {
  try {
    const userId = await getAdminUserId();
    const raw = String(formData.get('op_statuses') ?? '');
    const list = parseLines(raw);
    if (list.length < 2) return { error: 'Informe ao menos 2 status.' };
    await setWorkflowConfig('op_statuses', list, userId);
    revalidatePath('/mais');
    revalidatePath('/producao');
    return { success: 'Status de OP salvos.' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar.' };
  }
}

export async function saveProductionSteps(_prev: State, formData: FormData): Promise<State> {
  try {
    const userId = await getAdminUserId();
    const raw = String(formData.get('production_steps') ?? '');
    const list = parseLines(raw);
    if (list.length < 1) return { error: 'Informe ao menos 1 etapa.' };
    await setWorkflowConfig('production_steps', list, userId);
    revalidatePath('/mais');
    revalidatePath('/producao');
    return { success: 'Etapas de produção salvas.' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar.' };
  }
}

export async function savePaymentMethods(_prev: State, formData: FormData): Promise<State> {
  try {
    const userId = await getAdminUserId();
    const raw = String(formData.get('payment_methods') ?? '');
    // Format: "label|value" per line, or just "label" (value = slugified label)
    const list = parseLines(raw).map((line) => {
      const [label, value] = line.split('|').map((s) => s.trim());
      return {
        label: label ?? '',
        value: value ?? label?.toLowerCase().replace(/\s+/g, '_') ?? '',
      };
    }).filter((m) => m.label);

    if (list.length < 1) return { error: 'Informe ao menos 1 forma de pagamento.' };
    await setWorkflowConfig('payment_methods', list, userId);
    revalidatePath('/mais');
    revalidatePath('/vendas');
    return { success: 'Formas de pagamento salvas.' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar.' };
  }
}

export async function saveSeamstressRoles(_prev: State, formData: FormData): Promise<State> {
  try {
    const userId = await getAdminUserId();
    const raw = String(formData.get('seamstress_roles') ?? '');
    const list = parseLines(raw);
    if (list.length < 1) return { error: 'Informe ao menos 1 função.' };
    await setWorkflowConfig('seamstress_roles', list, userId);
    revalidatePath('/mais');
    revalidatePath('/costureiras');
    return { success: 'Funções de costureira salvas.' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar.' };
  }
}

export async function saveEmbroideryTypes(_prev: State, formData: FormData): Promise<State> {
  try {
    const userId = await getAdminUserId();
    const raw = String(formData.get('embroidery_types') ?? '');
    const list = parseLines(raw);
    if (list.length < 1) return { error: 'Informe ao menos 1 tipo de bordagem.' };
    await setWorkflowConfig('embroidery_types', list, userId);
    revalidatePath('/mais');
    revalidatePath('/bordagem');
    revalidatePath('/producao');
    return { success: 'Tipos de bordagem salvos.' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar.' };
  }
}

export async function saveProductSizes(_prev: State, formData: FormData): Promise<State> {
  try {
    const userId = await getAdminUserId();
    const list = parseLines(String(formData.get('product_sizes') ?? ''));
    if (list.length < 1) return { error: 'Informe ao menos 1 tamanho.' };
    await setWorkflowConfig('product_sizes', list, userId);
    revalidatePath('/mais');
    revalidatePath('/estoque');
    return { success: 'Tamanhos salvos.' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar.' };
  }
}

export async function saveProductFabrics(_prev: State, formData: FormData): Promise<State> {
  try {
    const userId = await getAdminUserId();
    const list = parseLines(String(formData.get('product_fabrics') ?? ''));
    if (list.length < 1) return { error: 'Informe ao menos 1 tecido.' };
    await setWorkflowConfig('product_fabrics', list, userId);
    revalidatePath('/mais');
    revalidatePath('/estoque');
    return { success: 'Tecidos salvos.' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar.' };
  }
}

export async function saveProductCategories(_prev: State, formData: FormData): Promise<State> {
  try {
    const userId = await getAdminUserId();
    const list = parseLines(String(formData.get('product_categories') ?? ''));
    if (list.length < 1) return { error: 'Informe ao menos 1 categoria.' };
    await setWorkflowConfig('product_categories', list, userId);
    revalidatePath('/mais');
    revalidatePath('/estoque');
    return { success: 'Categorias salvas.' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar.' };
  }
}

export async function saveProductColors(_prev: State, formData: FormData): Promise<State> {
  try {
    const userId = await getAdminUserId();
    const list = parseLines(String(formData.get('product_colors') ?? ''));
    if (list.length < 1) return { error: 'Informe ao menos 1 cor.' };
    await setWorkflowConfig('product_colors', list, userId);
    revalidatePath('/mais');
    revalidatePath('/estoque');
    return { success: 'Cores salvas.' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar.' };
  }
}
