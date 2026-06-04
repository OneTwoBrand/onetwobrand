/**
 * ONE TWO · Favorites Store
 * Persiste favoritos em localStorage. Sincroniza com Supabase opcionalmente
 * quando o cliente tem e-mail salvo no sessionStorage (pós-checkout).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteItem {
  pieceId:        string;
  slug:           string;
  name:           string;
  photoUrl:       string | null;
  price:          number;
  collectionName: string | null;
}

interface FavoritesState {
  items: FavoriteItem[];
  addFavorite:    (item: FavoriteItem) => void;
  removeFavorite: (pieceId: string) => void;
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorited:    (pieceId: string) => boolean;
  clear:          () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],

      addFavorite: (item) =>
        set((s) => ({
          items: s.items.some((i) => i.pieceId === item.pieceId)
            ? s.items
            : [...s.items, item],
        })),

      removeFavorite: (pieceId) =>
        set((s) => ({ items: s.items.filter((i) => i.pieceId !== pieceId) })),

      toggleFavorite: (item) => {
        const { isFavorited, addFavorite, removeFavorite } = get();
        isFavorited(item.pieceId) ? removeFavorite(item.pieceId) : addFavorite(item);
      },

      isFavorited: (pieceId) => get().items.some((i) => i.pieceId === pieceId),

      clear: () => set({ items: [] }),
    }),
    { name: 'ot-favorites' }
  )
);
