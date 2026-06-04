/**
 * ONE TWO · Shipping utilities
 * CEP autocomplete via ViaCEP.
 * Opções de frete fixas (integração real com Correios pode substituir).
 * Cache em memória por CEP (1h).
 */

export type ViaCepAddress = {
  cep:        string;
  street:     string;
  district:   string;
  city:       string;
  state:      string;
  ok:         boolean;
  error?:     string;
};

export type ShippingOption = {
  id:         string;
  label:      string;
  carrier:    string;
  days:       string;
  price:      number;
  free:       boolean;
};

const cepCache = new Map<string, { data: ViaCepAddress; expiresAt: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1h

/** Busca endereço pelo CEP via ViaCEP. */
export async function lookupCep(cep: string): Promise<ViaCepAddress> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return { cep, street: '', district: '', city: '', state: '', ok: false, error: 'CEP inválido.' };

  const cached = cepCache.get(clean);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('ViaCEP indisponível.');
    const json = await res.json();
    if (json.erro) return { cep: clean, street: '', district: '', city: '', state: '', ok: false, error: 'CEP não encontrado.' };

    const data: ViaCepAddress = {
      cep:      json.cep,
      street:   json.logradouro ?? '',
      district: json.bairro     ?? '',
      city:     json.localidade ?? '',
      state:    json.uf         ?? '',
      ok:       true,
    };

    cepCache.set(clean, { data, expiresAt: Date.now() + CACHE_TTL });
    return data;
  } catch (e) {
    return { cep: clean, street: '', district: '', city: '', state: '', ok: false, error: String(e) };
  }
}

/** Formata CEP com máscara: 22461005 → 22461-005 */
export function formatCep(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

const FREE_SHIPPING_THRESHOLD = 800;

/** Calcula opções de frete. Substitua pela API dos Correios se necessário. */
export function getShippingOptions(subtotal: number): ShippingOption[] {
  const isFree = subtotal >= FREE_SHIPPING_THRESHOLD;
  return [
    {
      id:      'sedex',
      label:   'Sedex',
      carrier: 'Correios',
      days:    '4–6 dias úteis',
      price:   isFree ? 0 : 38,
      free:    isFree,
    },
    {
      id:      'pac',
      label:   'PAC',
      carrier: 'Correios',
      days:    '8–12 dias úteis',
      price:   isFree ? 0 : 22,
      free:    isFree,
    },
    {
      id:      'retirada',
      label:   'Retirar no atelier',
      carrier: 'Retirada — Rio de Janeiro',
      days:    'Em 2 dias úteis',
      price:   0,
      free:    true,
    },
  ];
}

export const FREE_THRESHOLD = FREE_SHIPPING_THRESHOLD;
