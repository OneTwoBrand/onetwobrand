/**
 * ONE TWO · CartStore (Zustand)
 * Persiste em localStorage. Migra para conta ao logar.
 * Expõe estado e ações usadas por toda a jornada de compra.
 */
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  pieceId:    string;
  slug:       string;
  name:       string;
  size:       string;
  color:      string | null;
  photoUrl:   string | null;
  price:      number;
  qty:        number;
};

type CartState = {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;     // valor absoluto já calculado
  // actions
  addItem:       (item: Omit<CartItem, 'qty'>) => void;
  removeItem:    (pieceId: string, size: string) => void;
  updateQty:     (pieceId: string, size: string, qty: number) => void;
  applyCoupon:   (code: string, discount: number) => void;
  removeCoupon:  () => void;
  clearCart:     () => void;
  // derived
  itemCount:     () => number;
  subtotal:      () => number;
  total:         (shipping?: number) => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,

      addItem(item) {
        set((s) => {
          const existing = s.items.find(
            (i) => i.pieceId === item.pieceId && i.size === item.size
          );
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.pieceId === item.pieceId && i.size === item.size
                  ? { ...i, qty: i.qty + 1 }
                  : i
              ),
            };
          }
          return { items: [...s.items, { ...item, qty: 1 }] };
        });
      },

      removeItem(pieceId, size) {
        set((s) => ({
          items: s.items.filter(
            (i) => !(i.pieceId === pieceId && i.size === size)
          ),
        }));
      },

      updateQty(pieceId, size, qty) {
        if (qty < 1) {
          get().removeItem(pieceId, size);
          return;
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.pieceId === pieceId && i.size === size ? { ...i, qty } : i
          ),
        }));
      },

      applyCoupon(code, discount) {
        set({ couponCode: code, couponDiscount: discount });
      },

      removeCoupon() {
        set({ couponCode: null, couponDiscount: 0 });
      },

      clearCart() {
        set({ items: [], couponCode: null, couponDiscount: 0 });
      },

      itemCount() {
        return get().items.reduce((acc, i) => acc + i.qty, 0);
      },

      subtotal() {
        return get().items.reduce((acc, i) => acc + i.price * i.qty, 0);
      },

      total(shipping = 0) {
        return Math.max(0, get().subtotal() - get().couponDiscount + shipping);
      },
    }),
    { name: 'onetwo-cart' }
  )
);
