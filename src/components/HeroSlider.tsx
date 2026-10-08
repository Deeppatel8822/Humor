"use client";

import { useEffect, useState } from "react";
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
  const [paused, setPaused] = useState(false);

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
      className="relative overflow-hidden bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Humor Luxury featured collection"
    >
      <div className="relative w-full overflow-hidden">
        <img
          src={slide.heroImage}
          alt="Humor Luxury skincare hero banner"
          className="block h-auto w-full select-none"
          draggable={false}
        />
        <Link
          href={slide.href}
          aria-label={slide.cta}
          className="absolute left-[82%] top-[34.5%] h-[6%] w-[15%]"
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