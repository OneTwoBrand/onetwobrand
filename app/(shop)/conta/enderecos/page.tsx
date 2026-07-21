'use client';

/**
 * ONE TWO · /conta/enderecos
 * Lista e gerencia endereços do cliente.
 * O servidor identifica o cliente pela sessão HTTP assinada.
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import {
  deleteCustomerAddress,
  getCustomerAddresses,
  setDefaultCustomerAddress,
  type CustomerAddress,
} from '@/lib/shop/checkout-actions';

export default function EnderecosPage() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await getCustomerAddresses();
    setAddresses(result.addresses);
    setError(result.error ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function handleDelete(id: string) {
    const result = await deleteCustomerAddress(id);
    if (!result.ok) { setError(result.error ?? 'Não foi possível remover.'); return; }
    await load();
  }

  async function handleSetDefault(id: string) {
    const result = await setDefaultCustomerAddress(id);
    if (!result.ok) { setError(result.error ?? 'Não foi possível atualizar.'); return; }
    await load();
  }

  return (
    <div className="max-w-lg mx-auto pt-4 pb-28 lg:pb-10">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/conta" className="text-[12px] text-ink-soft hover:text-ink transition-colors">
          Minha conta
        </Link>
        <span className="text-ink-mute">/</span>
        <span className="text-[12px] text-ink font-medium">Endereços</span>
      </div>

      <h1 className="font-serif text-[24px] font-normal text-ink mb-6">Endereços</h1>

      {error && <p className="mb-4 text-[12px] text-danger">{error}</p>}

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-[16px] bg-surface animate-pulse" />
          ))}
        </div>
      )}

      {!loading && addresses.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-surface border border-line flex items-center justify-center text-primary">
            <MapPin size={22} strokeWidth={1.2} />
          </div>
          <p className="font-serif text-[18px] text-ink">Nenhum endereço salvo</p>
          <p className="text-[12px] text-ink-soft max-w-[240px] leading-relaxed">
            Os endereços usados no checkout aparecem aqui automaticamente.
          </p>
        </div>
      )}

      {!loading && addresses.length > 0 && (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-paper border border-line rounded-[16px] px-4 py-4 flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={14} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-ink">{addr.label}</p>
                  {addr.is_default && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      Padrão
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-ink-soft mt-0.5 leading-relaxed">
                  {addr.street}{addr.number ? ', ' + addr.number : ''}{addr.complement ? ' — ' + addr.complement : ''}
                  <br />
                  {addr.district ? addr.district + ', ' : ''}{addr.city}/{addr.state} · CEP {addr.cep}
                </p>
                {!addr.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="mt-2 text-[11px] text-primary hover:underline"
                  >
                    Definir como padrão
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(addr.id)}
                aria-label="Remover endereço"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-danger-soft text-ink-mute hover:text-danger transition-colors shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/checkout"
          className="flex items-center justify-center gap-2 h-12 rounded-full border border-dashed border-line text-[12px] font-medium text-ink-soft hover:border-primary hover:text-primary transition-colors"
        >
          <Plus size={14} />
          Adicionar via checkout
        </Link>
      </div>
    </div>
  );
}
