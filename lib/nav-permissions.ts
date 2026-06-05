// All navigable hrefs that can be individually toggled per non-admin user.
// Admin users always have full access regardless of this list.
export const ALL_NAV_HREFS = [
  '/',
  '/producao',
  '/bordagem',
  '/costureiras',
  '/estoque',
  '/catalogo',
  '/clientes',
  '/negociacoes',
  '/vendas',
  '/financeiro',
  '/relatorios',
  '/assistant',
  '/mais',
] as const;

export type NavHref = (typeof ALL_NAV_HREFS)[number];

export const NAV_LABELS: Record<NavHref, string> = {
  '/':             'Início',
  '/producao':     'Produção',
  '/bordagem':     'Bordagem',
  '/costureiras':  'Costureiras',
  '/estoque':      'Estoque',
  '/catalogo':     'Coleções',
  '/clientes':     'Clientes',
  '/negociacoes':  'Negociações',
  '/vendas':       'Vendas',
  '/financeiro':   'Financeiro',
  '/relatorios':   'Relatórios',
  '/assistant':    'OneTwo Assistente',
  '/mais':         'Configurações',
};

export function parseNavPermissions(raw: unknown): NavHref[] {
  if (!Array.isArray(raw)) return [...ALL_NAV_HREFS];
  return raw.filter((v): v is NavHref => ALL_NAV_HREFS.includes(v as NavHref));
}

export function canAccess(permissions: NavHref[] | null, href: string): boolean {
  if (permissions === null) return true; // admin path — always allow
  return permissions.some((p) => p === href);
}
