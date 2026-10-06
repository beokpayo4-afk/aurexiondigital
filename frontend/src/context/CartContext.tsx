import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";
import { addCartItem, addCartPackage, claimCart, fetchCart, removeCartItem, updateCartItem, type Cart } from "@/services/shopService";

type CartContextValue = {
  cart: Cart | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (productId: string, options?: { open?: boolean }) => Promise<void>;
  addPackage: (packageId: string, options?: { open?: boolean }) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    setCart(await fetchCart());
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    let active = true;
    const load = user ? claimCart() : fetchCart();
    load
      .then((next) => {
        if (active) {
          setCart(next);
        }
      })
      .catch(() => {
        if (active) {
          setCart(null);
        }
      });
    return () => {
      active = false;
    };
  }, [isReady, user?.id]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      open,
      setOpen,
      refresh,
      add: async (productId, options) => {
        setCart(await addCartItem(productId));
        if (options?.open !== false) {
          setOpen(true);
        }
      },
      addPackage: async (packageId, options) => {
        setCart(await addCartPackage(packageId));
        if (options?.open !== false) {
          setOpen(true);
        }
      },
      update: async (itemId, quantity) => {
        setCart(await updateCartItem(itemId, quantity));
      },
      remove: async (itemId) => {
        setCart(await removeCartItem(itemId));
      },
    }),
    [cart, open, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used within CartProvider");
  }
  return value;
}
