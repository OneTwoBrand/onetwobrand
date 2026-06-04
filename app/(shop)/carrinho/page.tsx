/**
 * ONE TWO · /carrinho — Sacola de compras
 * Client Component — lê CartStore (Zustand + localStorage).
 * Mobile: lista vertical + sticky footer. Desktop: idem com max-width.
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, Tag, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/shop/cart-store';
import { validateCoupon, getShippingConfig } from '@/lib/shop/checkout-actions';
import { brl } from '@/lib/utils';
import { FREE_THRESHOLD } from '@/lib/shop/shipping';

export default function CarrinhoPage() {
  const { items, couponCode, couponDiscount, updateQty, removeItem,
          applyCoupon, removeCoupon, subtotal, total, itemCount } = useCartStore();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [freeThreshold, setFreeThreshold] = useState(FREE_THRESHOLD);

  const sub   = subtotal();
  const count = itemCount();
  const toFree = Math.max(0, freeThreshold - sub);

  useEffect(() => {
    getShippingConfig(sub).then((cfg) => setFreeThreshold(cfg.freeThreshold));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCoupon() {
    setCouponLoading(true);
    setCouponError('');
    const res = await validateCoupon(couponInput.trim(), sub);
    if (res.ok) {
      applyCoupon(res.code, res.discount);
      setCouponOpen(false);
      setCouponInput('');
    } else {
      setCouponError(res.error);
    }
    setCouponLoading(false);
  }

  if (count === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center">
          <ShoppingBag size={24} className="text-ink-mute" strokeWidth={1.5} />
        </div>
        <p className="font-serif text-[20px] text-ink">Sua sacola está vazia.</p>
        <p className="text-[12px] text-ink-soft text-center max-w-[200px] leading-[1.55]">
          Explore a coleção e encontre sua próxima peça.
        </p>
        <Link
          href="/loja"
          className="mt-2 h-11 px-6 rounded-full border border-line text-[11px] font-medium tracking-[0.16em] uppercase text-ink hover:bg-ink/5 transition-colors flex items-center"
        >
          Explorar coleções
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-[640px] mx-auto lg:max-w-none lg:flex-row lg:gap-10 lg:items-start">
      {/* ── Lista de itens ────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3">
        <h1 className="font-serif text-[28px] font-light text-ink">
          Sacola <span className="text-ink-mute text-[20px]">({count})</span>
        </h1>

        {items.map((item) => (
          <div key={`${item.pieceId}-${item.size}`}
               className="flex gap-3 bg-paper border border-line rounded-[16px] p-3">
            {/* Foto */}
            <div className="w-[86px] h-[106px] rounded-[10px] overflow-hidden bg-surface shrink-0">
              {item.photoUrl ? (
                <Image src={item.photoUrl} alt={item.name} width={86} height={106} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-surface-warm" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-serif text-[15px] text-ink leading-snug">{item.name}</p>
                  <p className="text-[11px] text-ink-mute mt-0.5">Tam {item.size}{item.color ? ` · ${item.color}` : ''}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.pieceId, item.size)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-danger-soft text-ink-mute hover:text-danger transition-colors shrink-0"
                  aria-label="Remover item"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                {/* Stepper */}
                <div className="flex items-center gap-2 bg-surface rounded-full h-8 px-1">
                  <button
                    type="button"
                    onClick={() => updateQty(item.pieceId, item.size, item.qty - 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-ink/10 transition-colors"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-[13px] font-medium text-ink w-4 text-center">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.pieceId, item.size, item.qty + 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-ink/10 transition-colors"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="font-serif text-[16px] text-ink">{brl(item.price * item.qty)}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Cupom */}
        <div className="rounded-[14px] border border-dashed border-line bg-transparent overflow-hidden">
          {couponCode ? (
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-success" />
                <span className="text-[12px] font-medium text-success tracking-[0.12em] uppercase">{couponCode}</span>
                <span className="text-[11px] text-ink-soft">− {brl(couponDiscount, { decimals: true })}</span>
              </div>
              <button type="button" onClick={removeCoupon} className="text-[10px] font-medium tracking-[0.14em] uppercase text-ink-mute underline">
                Remover
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCouponOpen((o) => !o)}
              className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-ink/3 transition-colors"
            >
              <Tag size={14} className="text-ink-mute" />
              <span className="text-[12px] font-medium text-ink tracking-[0.12em] flex-1">Aplicar cupom</span>
              <span className="text-[10px] text-ink-mute">›</span>
            </button>
          )}

          {couponOpen && !couponCode && (
            <div className="px-4 pb-3 flex gap-2 border-t border-line">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleCoupon()}
                placeholder="CÓDIGO"
                className="flex-1 h-10 bg-surface rounded-[10px] px-3 text-[13px] font-medium tracking-[0.12em] text-ink placeholder:text-ink-mute focus:outline-none focus:ring-1 focus:ring-primary"
                style={{ fontSize: 16 }}
              />
              <button
                type="button"
                onClick={handleCoupon}
                disabled={couponLoading || !couponInput}
                className="h-10 px-4 rounded-[10px] bg-ink text-paper text-[11px] font-medium tracking-[0.14em] uppercase disabled:opacity-40 transition-colors"
              >
                {couponLoading ? '…' : 'Aplicar'}
              </button>
            </div>
          )}
          {couponError && <p className="px-4 pb-3 text-[11px] text-danger">{couponError}</p>}
        </div>
      </div>

      {/* ── Sticky footer / sidebar resumo ────────────────── */}
      <div className="lg:w-[320px] lg:sticky lg:top-24">
        <div className="fixed lg:static inset-x-0 bottom-0 z-20 bg-paper/95 backdrop-blur-sm border-t border-line lg:border lg:rounded-[18px] lg:bg-paper"
             style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="p-5">
            {toFree > 0 && (
              <p className="text-[11px] text-ink-soft mb-3 text-center">
                Falta <span className="text-ink font-medium">{brl(toFree)}</span> para frete grátis
              </p>
            )}

            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[10px] font-medium tracking-[0.20em] uppercase text-ink-soft">Subtotal · {count} {count === 1 ? 'peça' : 'peças'}</span>
              <span className="font-serif text-[18px] text-ink">{brl(sub)}</span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-[10px] font-medium tracking-[0.20em] uppercase text-success">Desconto</span>
                <span className="text-[13px] text-success">− {brl(couponDiscount, { decimals: true })}</span>
              </div>
            )}

            <Link
              href="/checkout"
              className="mt-3 flex items-center justify-center gap-2.5 w-full h-[52px] rounded-full bg-primary text-paper text-[12px] font-medium tracking-[0.20em] uppercase hover:bg-primary-hover transition-colors"
            >
              Finalizar compra
            </Link>
          </div>
        </div>
        {/* Espaçador para o sticky footer mobile */}
        <div className="h-32 lg:hidden" />
      </div>
    </div>
  );
}
