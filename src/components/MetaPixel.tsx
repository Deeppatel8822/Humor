"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
    __humorMetaPixelInitialized?: boolean;
  }
}

const PIXEL_ID = "2402839457180006";

export default function MetaPixel() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!window.fbq) {
      const fbq: any = function (...args: any[]) {
        if (fbq.callMethod) {
          fbq.callMethod.apply(fbq, args);
        } else {
          fbq.queue.push(args);
        }
      };
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];
      window.fbq = fbq;
      window._fbq = fbq;

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    }

    const pixel = window.fbq;
    if (typeof pixel !== "function") return;

    if (!window.__humorMetaPixelInitialized) {
      pixel("init", PIXEL_ID);
      window.__humorMetaPixelInitialized = true;
    }

    if (pathname && lastTrackedPath.current !== pathname) {
      pixel("track", "PageView");
      lastTrackedPath.current = pathname;
    }
  }, [pathname]);

  return null;
}
