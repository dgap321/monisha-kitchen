import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  cart: { itemId: number; quantity: number }[];
  addToCart: (itemId: number) => void;
  removeFromCart: (itemId: number) => void;
  clearCart: () => void;

  viewMode: "customer" | "merchant";
  toggleViewMode: () => void;
  isMerchantAuthenticated: boolean;
  merchantToken: string | null;
  merchantLocationSet: boolean;
  merchantLogin: (token: string) => void;
  merchantLogout: () => void;
  setMerchantLocationSet: () => void;

  user: { phoneNumber: string; name?: string; address?: string; location?: { lat: number; lng: number }; isBlocked?: boolean } | null;
  isAuthenticated: boolean;
  login: (phoneNumber: string) => void;
  updateProfile: (details: { name: string; address: string; location?: { lat: number; lng: number } }) => void;
  setUser: (user: AppState["user"]) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      cart: [],
      addToCart: (itemId) =>
        set((state) => {
          const existing = state.cart.find((i) => i.itemId === itemId);
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { cart: [...state.cart, { itemId, quantity: 1 }] };
        }),
      removeFromCart: (itemId) =>
        set((state) => {
          const existing = state.cart.find((i) => i.itemId === itemId);
          if (existing && existing.quantity > 1) {
            return {
              cart: state.cart.map((i) =>
                i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i
              ),
            };
          }
          return { cart: state.cart.filter((i) => i.itemId !== itemId) };
        }),
      clearCart: () => set({ cart: [] }),

      viewMode: "customer",
      toggleViewMode: () =>
        set((state) => ({
          viewMode: state.viewMode === "customer" ? "merchant" : "customer",
        })),
      isMerchantAuthenticated: false,
      merchantToken: null,
      merchantLocationSet: false,
      merchantLogin: (token: string) => set({ isMerchantAuthenticated: true, merchantToken: token, viewMode: "merchant", merchantLocationSet: false }),
      merchantLogout: () => set({ isMerchantAuthenticated: false, merchantToken: null, viewMode: "customer", merchantLocationSet: false }),
      setMerchantLocationSet: () => set({ merchantLocationSet: true }),

      user: null,
      isAuthenticated: false,
      login: (phoneNumber) => {
        set({ isAuthenticated: true, user: { phoneNumber } });
      },
      updateProfile: (details) =>
        set((state) => {
          if (!state.user) return state;
          return { user: { ...state.user, ...details } };
        }),
      setUser: (user) => set({ user }),
      logout: () => set({ isAuthenticated: false, user: null, cart: [] }),
    }),
    {
      name: "monisha-kitchen-v3",
    }
  )
);
