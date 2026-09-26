"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Product } from "@/types/product";

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  price_inr: number;
  quantity: number;
  shopifyVariantId: string | null;
  image: string | null;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalInr: number;
  startCheckout: () => Promise<{ mode: "shopify" | "local"; url?: string }>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "humor-luxury-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Partial<CartLine>[];
        setLines(
          stored.map((line) => ({
            productId: line.productId ?? "",
            slug: line.slug ?? "",
            name: line.name ?? "",
            price_inr: Number(line.price_inr ?? 0),
            quantity: Number(line.quantity ?? 1),
            shopifyVariantId: line.shopifyVariantId ?? null,
            image: line.image ?? null,
          }))
        );
      }
    } catch {
      // Corrupt or unavailable storage — start with an empty cart.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  function addItem(product: Product, quantity = 1) {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price_inr: product.price_inr,
          quantity,
          shopifyVariantId: product.shopify_variant_id,
          image: product.images?.[0] ?? null,
        },
      ];
    });
  }

  function removeItem(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) return removeItem(productId);
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)));
  }

  function clearCart() {
    setLines([]);
  }

  async function startCheckout(): Promise<{ mode: "shopify" | "local"; url?: string }> {
    try {
      const statusRes = await fetch("/api/shopify-status");
      const { configured } = await statusRes.json();

      if (configured && lines.every((l) => l.shopifyVariantId)) {
        const res = await fetch("/api/cart/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lines: lines.map((l) => ({ variantId: l.shopifyVariantId, quantity: l.quantity })),
          }),
        });
        const data = await res.json();
        if (res.ok && data.checkoutUrl) {
          return { mode: "shopify", url: data.checkoutUrl };
        }
      }
    } catch {
      // Shopify not reachable/configured — fall through to local checkout.
    }
    return { mode: "local" };
  }

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotalInr = lines.reduce((sum, l) => sum + l.price_inr * l.quantity, 0);

  return (
    <CartContext.Provider
      value={{ lines, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotalInr, startCheckout }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
