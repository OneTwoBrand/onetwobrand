import { createClient } from '@/lib/supabase/server';

// ── Default values (used as fallback when DB has no custom config) ──
export const DEFAULT_OP_STATUSES = [
  'Aberta',
  'Aguardando Material',
  'Em Produção',
  'Em Bordagem',
  'Em Revisão',
  'Finalizada',
  'Entregue',
];

export const DEFAULT_PRODUCTION_STEPS = [
  'Corte',
  'Costura',
  'Bordagem',
  'Revisão',
  'Entrega',
];

export const DEFAULT_PAYMENT_METHODS = [
  { value: 'pix',         label: 'PIX' },
  { value: 'cash',        label: 'Dinheiro' },
  { value: 'debit',       label: 'Débito' },
  { value: 'credit',      label: 'Crédito' },
  { value: 'installment', label: 'Parcelado' },
  { value: 'transfer',    label: 'Transferência' },
];

export const DEFAULT_SEAMSTRESS_ROLES = [
  'Costureira',
  'Costureira-chefe',
  'Bordadeira',
  'Atelier · QA',
];

export const DEFAULT_PRODUCT_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'Único'];

export const DEFAULT_PRODUCT_FABRICS = [
  'Linho', 'Crepe', 'Algodão Pima', 'Algodão', 'Seda', 'Musseline', 'Viscose', 'Tricoline',
];

export const DEFAULT_PRODUCT_CATEGORIES = [
  'Vestido', 'Blusa', 'Conjunto', 'Saia', 'Calça', 'Shorts', 'Macacão', 'Kimono',
];

export const DEFAULT_PRODUCT_COLORS = [
  'Cru', 'Off-white', 'Terracota', 'Rosé', 'Preto', 'Marfim', 'Azul', 'Verde', 'Vinho', 'Caramelo',
];

export type WorkflowConfigKey =
  | 'op_statuses'
  | 'production_steps'
  | 'payment_methods'
  | 'seamstress_roles'
  | 'product_sizes'
  | 'product_fabrics'
  | 'product_categories'
  | 'product_colors';

export type PaymentMethod = { value: string; label: string };

export type WorkflowConfig = {
  op_statuses: string[];
  production_steps: string[];
  payment_methods: PaymentMethod[];
  seamstress_roles: string[];
  product_sizes: string[];
  product_fabrics: string[];
  product_categories: string[];
  product_colors: string[];
};

// ── Read all config keys at once ──────────────────────────────────
export async function getWorkflowConfig(): Promise<WorkflowConfig> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workflow_config')
      .select('key, value');

    if (error || !data) return getDefaults();

    const map = new Map(data.map((r) => [r.key, r.value]));

    return {
      op_statuses:        (map.get('op_statuses') as string[])            ?? DEFAULT_OP_STATUSES,
      production_steps:   (map.get('production_steps') as string[])       ?? DEFAULT_PRODUCTION_STEPS,
      payment_methods:    (map.get('payment_methods') as PaymentMethod[]) ?? DEFAULT_PAYMENT_METHODS,
      seamstress_roles:   (map.get('seamstress_roles') as string[])       ?? DEFAULT_SEAMSTRESS_ROLES,
      product_sizes:      (map.get('product_sizes') as string[])          ?? DEFAULT_PRODUCT_SIZES,
      product_fabrics:    (map.get('product_fabrics') as string[])        ?? DEFAULT_PRODUCT_FABRICS,
      product_categories: (map.get('product_categories') as string[])     ?? DEFAULT_PRODUCT_CATEGORIES,
      product_colors:     (map.get('product_colors') as string[])         ?? DEFAULT_PRODUCT_COLORS,
    };
  } catch {
    return getDefaults();
  }
}

function getDefaults(): WorkflowConfig {
  return {
    op_statuses:        DEFAULT_OP_STATUSES,
    production_steps:   DEFAULT_PRODUCTION_STEPS,
    payment_methods:    DEFAULT_PAYMENT_METHODS,
    seamstress_roles:   DEFAULT_SEAMSTRESS_ROLES,
    product_sizes:      DEFAULT_PRODUCT_SIZES,
    product_fabrics:    DEFAULT_PRODUCT_FABRICS,
    product_categories: DEFAULT_PRODUCT_CATEGORIES,
    product_colors:     DEFAULT_PRODUCT_COLORS,
  };
}

// ── Write a single key (admin only — enforced by RLS) ────────────
export async function setWorkflowConfig(
  key: WorkflowConfigKey,
  value: unknown,
  userId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('workflow_config')
    .upsert(
      { key, value, updated_at: new Date().toISOString(), updated_by: userId },
      { onConflict: 'key' }
    );
  if (error) throw new Error(error.message);
}
