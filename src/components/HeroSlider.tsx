"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const slides = [
  {
    fullWidth: true,
    heroImage: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JURoT4iavdacXhU0ts1qPbohKm/f0043f74-6f29-4bf5-85c7-0af17d06741b.png",
    eyebrow: "All Products",
    title: <>Discover Humor Luxury.<br />All Products.</>,
    cta: "Shop Now",
    href: "/shop",
    productCta: "",
    productHref: "/shop",
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
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5600);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section
      className="relative cursor-grab overflow-hidden bg-white active:cursor-grabbing"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={(event) => { if (event.pointerType === "mouse") pointerStartX.current = event.clientX; }}
      onPointerUp={(event) => {
        if (event.pointerType !== "mouse" || pointerStartX.current == null) return;
        const dx = event.clientX - pointerStartX.current;
        pointerStartX.current = null;
        if (Math.abs(dx) < 50) return;
        setActive((current) => (current + (dx < 0 ? 1 : slides.length - 1)) % slides.length);
      }}
      onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; touchStartY.current = event.touches[0]?.clientY ?? null; }}
      onTouchEnd={(event) => {
        const startX = touchStartX.current;
        const startY = touchStartY.current;
        const endX = event.changedTouches[0]?.clientX;
        const endY = event.changedTouches[0]?.clientY;
        touchStartX.current = null; touchStartY.current = null;
        if (startX == null || startY == null || endX == null || endY == null) return;
        const dx = endX - startX;
        const dy = endY - startY;
        if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
        setActive((current) => (current + (dx < 0 ? 1 : slides.length - 1)) % slides.length);
      }}
      aria-label="Humor Luxury featured collection"
    >
      <div className="relative w-full overflow-hidden">
        {/* Keep the natural image ratio as the responsive banner height. */}
        <img
          src={slides[0].heroImage}
          alt=""
          aria-hidden="true"
          className="block h-auto w-full opacity-0"
          draggable={false}
        />
        {slides.map((slide, index) => (
          <Link
            key={slide.heroImage}
            href={slide.href}
            aria-label={slide.cta}
            tabIndex={active === index ? 0 : -1}
            aria-hidden={active !== index}
            className={"absolute inset-0 block w-full overflow-hidden transition-opacity duration-1000 ease-in-out " + (
              active === index ? "z-10 opacity-100 pointer-events-auto" : "z-0 opacity-0 pointer-events-none"
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={slide.heroImage}
              alt="Humor Luxury featured collection"
              className={"humor-banner-image block h-full w-full select-none object-cover " + (
                active === index ? "humor-banner-image-active" : ""
              )}
              draggable={false}
            />
          </Link>
        ))}
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
