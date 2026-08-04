import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppliedCoupon } from "@/lib/cart-math";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  /** Reference / struck-through price when the piece is on sale. */
  compareAt?: number | null;
  image: string;
  slug: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clear: () => void;
  couponCode: string;
  setCouponCode: (v: string) => void;
  appliedCoupon: AppliedCoupon | null;
  setAppliedCoupon: (c: AppliedCoupon | null) => void;
  clearCoupon: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "peuu_cart_v1";
const COUPON_KEY = "peuu_coupon_code";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [couponCode, setCouponCodeState] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
      const code = typeof window !== "undefined" ? localStorage.getItem(COUPON_KEY) : null;
      if (code) setCouponCodeState(code);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const setCouponCode = useCallback((v: string) => {
    setCouponCodeState(v);
    try {
      if (v) localStorage.setItem(COUPON_KEY, v);
      else localStorage.removeItem(COUPON_KEY);
    } catch {}
  }, []);

  const clearCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode("");
  }, [setCouponCode]);

  const add = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...item, quantity: copy[idx].quantity + qty };
        return copy;
      }
      return [...prev, { ...item, quantity: qty }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setQuantity = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, quantity: Math.max(0, qty) } : p))
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
  }, []);

  // Any cart mutation invalidates a previously verified coupon: the discount is
  // re-validated server-side before it can affect a charge.
  useEffect(() => {
    setAppliedCoupon(null);
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
    return {
      items,
      count,
      total,
      open,
      setOpen,
      add,
      remove,
      setQuantity,
      clear,
      couponCode,
      setCouponCode,
      appliedCoupon,
      setAppliedCoupon,
      clearCoupon,
    };
  }, [items, open, add, remove, setQuantity, clear, couponCode, setCouponCode, appliedCoupon, clearCoupon]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
