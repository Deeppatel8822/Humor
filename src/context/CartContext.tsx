"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Product } from "@/types/product";
import { calculateBundleSavings } from "@/lib/bundles";

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
  trackCartActivity: (eventType: string, lines?: CartLine[], contact?: { fullName?: string; email?: string; phone?: string }) => void;
  itemCount: number;
  subtotalInr: number;
  bundleSavingsInr: number;
  startCheckout: () => Promise<{ mode: "shopify" | "local"; url?: string }>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "humor-luxury-cart";
const SESSION_KEY = "humor-cart-session-id";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [bundleDiscountPercent, setBundleDiscountPercent] = useState(8);

  useEffect(() => {
    fetch("/api/admin/pricing", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => {
      const rule = data?.discounts?.bundle ?? data?.settings?.discounts?.bundle;
      if (rule) setBundleDiscountPercent(rule.enabled && rule.type === "percent" ? Number(rule.value) || 0 : 0);
    }).catch(() => {});
  }, []);

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

  function trackCartActivity(eventType: string, eventLines: CartLine[] = lines, contact?: { fullName?: string; email?: string; phone?: string }) {
    if (typeof window === "undefined") return;
    try {
      let sessionId = window.localStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        sessionId = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : "cart_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        window.localStorage.setItem(SESSION_KEY, sessionId);
      }
      void fetch("/api/admin/cart-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          session_id: sessionId,
          event_type: eventType,
          lines: eventLines,
          cart_value_inr: eventLines.reduce((sum, line) => sum + line.price_inr * line.quantity, 0),
          page_path: window.location.pathname,
          customer_name: contact?.fullName || "",
          email: contact?.email || "",
          phone: contact?.phone || "",
        }),
      }).catch(() => {});
    } catch {
      // Tracking must never block shopping or checkout.
    }
  }

  function addItem(product: Product, quantity = 1) {
    const current = lines.find((line) => line.productId === product.id);
    trackCartActivity("add_to_cart", [{ productId: product.id, slug: product.slug, name: product.name, price_inr: product.price_inr, quantity: current ? current.quantity + quantity : quantity, shopifyVariantId: product.shopify_variant_id, image: product.images?.[0] ?? null }]);
    if (typeof window !== "undefined") {
      window.setTimeout(() => window.dispatchEvent(new CustomEvent("humor-open-cart-popup")), 0);
    }
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
    const removed = lines.find((line) => line.productId === productId);
    if (removed) trackCartActivity("remove_from_cart", [removed]);
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) return removeItem(productId);
    const updated = lines.find((line) => line.productId === productId);
    if (updated) trackCartActivity("quantity_updated", [{ ...updated, quantity }]);
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)));
  }

  function clearCart() {
    if (lines.length) trackCartActivity("purchase_completed", lines); 
    setLines([]);
  }

  async function startCheckout(): Promise<{ mode: "shopify" | "local"; url?: string }> {
    trackCartActivity("checkout_started", lines);
    try {
      const statusRes = await fetch("/api/shopify-status");
      const { configured } = await statusRes.json();

      if (configured && bundleSavingsInr === 0 && lines.every((l) => l.shopifyVariantId)) {
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
  const bundleSavingsInr = calculateBundleSavings(lines, lines.map((line) => ({ slug: line.slug, price_inr: line.price_inr })), bundleDiscountPercent);

  return (
    <CartContext.Provider
      value={{ lines, addItem, removeItem, updateQuantity, clearCart, trackCartActivity, itemCount, subtotalInr, bundleSavingsInr, startCheckout }}
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
