"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const slides = [
  {
    fullWidth: true,
    heroImage: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JURoT4iavdacXhU0ts1qPbohKm/f0043f74-6f29-4bf5-85c7-0af17d06741b.png",
    eyebrow: "Face Serum",
    title: <>Targeted Care.<br />Visible Glow.</>,
    cta: "Shop Serums",
    href: "/shop",
    productCta: "View Velvet Touch",
    productHref: "/product/velvet-touch-face-serum",
  },
  {
    fullWidth: true,
    heroImage: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JURoT4iavdacXhU0ts1qPbohKm/2fce331a-18d3-4782-b35b-4020caa0727c.png",
    eyebrow: "Hair Care",
    title: <>Stronger. Smoother.<br />Healthier Hair.</>,
    cta: "Shop Now",
    href: "/collections/hair-care",
    productCta: "",
    productHref: "/collections/hair-care",
  },
  {
    fullWidth: true,
    heroImage: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JURoT4iavdacXhU0ts1qPbohKm/d589c439-1e72-45ff-ae10-ef044626314d.png",
    eyebrow: "Daily Skin Care Ritual",
    title: <>Healthy Skin<br />Looks Good On You</>,
    cta: "Shop Now",
    href: "/collections/skin-care",
    productCta: "",
    productHref: "/collections/skin-care",
  },
] as const;

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);\n  const touchStartX = useRef<number | null>(null);\n  const touchStartY = useRef<number | null>(null);\n  const pointerStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const slide = slides[active];

  return (
    <section
      className="relative cursor-grab overflow-hidden bg-white active:cursor-grabbing"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}\n      onPointerDown={(event) => { if (event.pointerType === "mouse") pointerStartX.current = event.clientX; }}
      onPointerUp={(event) => {
        if (event.pointerType !== "mouse" || pointerStartX.current == null) return;
        const dx = event.clientX - pointerStartX.current;
        pointerStartX.current = null;
        if (Math.abs(dx) < 50) return;
        setActive((current) => (current + (dx < 0 ? 1 : slides.length - 1)) % slides.length);
      }}
      onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; touchStartY.current = event.touches[0]?.clientY ?? null; }}\n      onTouchEnd={(event) => {\n        const startX = touchStartX.current;\n        const startY = touchStartY.current;\n        const endX = event.changedTouches[0]?.clientX;\n        const endY = event.changedTouches[0]?.clientY;\n        touchStartX.current = null; touchStartY.current = null;\n        if (startX == null || startY == null || endX == null || endY == null) return;\n        const dx = endX - startX;\n        const dy = endY - startY;\n        if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;\n        setActive((current) => (current + (dx < 0 ? 1 : slides.length - 1)) % slides.length);\n      }}
      aria-label="Humor Luxury featured collection"
    >
      <div className="relative w-full overflow-hidden">
        <img
          src={slide.heroImage}
          alt="Humor Luxury skincare hero banner"
          className="block h-auto w-full select-none transition-transform duration-700 ease-out hover:scale-[1.01]"
          draggable={false}
        />
        <Link
          href={slide.href}
          aria-label={slide.cta}
          className="absolute left-[78%] top-[32%] h-[12%] w-[20%]"
        />
        {slide.productCta ? (
          <Link
            href={slide.productHref}
            aria-label={slide.productCta}
            className="absolute left-[52.1%] top-[68.4%] h-[8%] w-[11.8%]"
          />
        ) : null}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-2 py-4">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActive(index)}
            aria-label={"Go to slide " + (index + 1)}
            aria-current={active === index ? "true" : undefined}
            className={active === index ? "h-1.5 w-8 rounded-full bg-[#8f286f] transition-all" : "h-1.5 w-1.5 rounded-full bg-white/80 ring-1 ring-[#b8899e] transition-all hover:w-3"}
          />
        ))}
      </div>
    </section>
  );
} 