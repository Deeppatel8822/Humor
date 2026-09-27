"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function MetaPixel() {
  useEffect(() => {
    if (!pixelId || window.fbq) return;

    const fbq = (...args: unknown[]) => {
      window.fbq?.(...args);
    };

    window.fbq = fbq;
    window._fbq = fbq;

    fbq("init", pixelId);
    fbq("track", "PageView");

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }, []);

  return null;
}
