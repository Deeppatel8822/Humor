"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "humor-cart-session-id";

function getSessionId() {
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : "traffic_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function deviceType() {
  const ua = navigator.userAgent || "";
  if (/tablet|ipad/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
  return /mobile|iphone|ipod|android/i.test(ua) ? "mobile" : "desktop";
}

export default function TrafficTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const productSlug = pathname.match(/^\/(?:product|products)\/([^/]+)/i)?.[1] || null;
      const referrer = document.referrer;
      const host = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : "";
      const source = params.get("utm_source") || (host ? host : "direct");
      const medium = params.get("utm_medium") || (host ? "referral" : "direct");
      const sessionId = getSessionId();
      const lastPath = window.sessionStorage.getItem("humor-last-tracked-path");
      const navigationKey = pathname + window.location.search;
      if (lastPath === navigationKey) return;
      window.sessionStorage.setItem("humor-last-tracked-path", navigationKey);
      void fetch("/api/traffic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          session_id: sessionId,
          page_path: pathname,
          page_title: document.title,
          referrer,
          source,
          medium,
          campaign: params.get("utm_campaign") || "",
          device_type: deviceType(),
          product_slug: productSlug,
        }),
      }).catch(() => {});
    } catch {
      // Analytics must never interfere with the storefront.
    }
  }, [pathname]);

  return null;
}
