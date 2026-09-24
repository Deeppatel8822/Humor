"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const slides = [
  {
    leftImage: "https://humorluxury.com/wp-content/uploads/2023/10/VHR02812-min-1-new.webp",
    rightImage: "https://humorluxury.com/wp-content/uploads/2023/10/3-new.webp",
    eyebrow: "Best Price",
    title: <>Premium Quality<br />Makeup Cosmetics</>,
    cta: "Explore More",
    href: "/shop",
    leftLabel: "Premium Beauty",
    leftTitle: "Blemish Block",
    leftHref: "/collections/skin-care",
    rightHref: "/product/fullmoon-face-wash",
  },
  {
    leftImage: "https://humorluxury.com/wp-content/uploads/2023/10/VHR01781_11zon-new.webp",
    rightImage: "https://humorluxury.com/wp-content/uploads/2023/10/3-new.webp",
    eyebrow: "Best Price",
    title: <>Redefine Your<br />Beauty With Humor Luxury</>,
    cta: "Explore More",
    href: "/shop",
    leftLabel: "Skin Care",
    leftTitle: "Velvet Touch",
    leftHref: "/product/velvet-touch-face-wash",
    rightHref: "/product/fullmoon-face-wash",
  },
  {
    leftImage: "https://humorluxury.com/wp-content/uploads/2023/10/5-new.webp",
    rightImage: "https://humorluxury.com/wp-content/uploads/2023/10/VHR02439-scaled-new.webp",
    eyebrow: "Latest Range",
    title: <>Dermatologist Tested<br />Cosmetics Products</>,
    cta: "Explore More",
    href: "/shop",
    leftLabel: "Beauty Essentials",
    leftTitle: "Humor Luxury",
    leftHref: "/shop",
    rightHref: "/product/sunscreen-spf-50",
  },
];

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 2000);
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
      <div className="relative grid min-h-[560px] grid-cols-1 md:min-h-[680px] md:grid-cols-3">
        <Link href={slide.leftHref} className="group relative min-h-[430px] overflow-hidden md:min-h-0">
          <img src={slide.leftImage} alt={slide.leftTitle} className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#38171c]/80 via-[#38171c]/15 to-transparent" />
          <div className="absolute bottom-10 left-7 z-10 text-white md:left-10 md:bottom-12">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.28em]">{slide.leftLabel}</p>
            <h2 className="font-display text-3xl md:text-[42px]">{slide.leftTitle}</h2>
            <span className="mt-5 inline-flex bg-[#8f286f] px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-lg transition-all duration-300 group-hover:-translate-y-1">
              Shop Now
            </span>
          </div>
        </Link>

        <div className="relative flex min-h-[350px] items-center justify-center overflow-hidden bg-[#ead8e2] px-7 text-center md:min-h-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.8),transparent_48%)]" />
          <span className="absolute left-[8%] top-[13%] h-12 w-7 rotate-[28deg] rounded-[100%_0] border border-[#b67a96]/35 motion-safe:animate-[humorHeroFloat_6s_ease-in-out_infinite]" />
          <span className="absolute right-[10%] top-[18%] h-16 w-8 rotate-[-32deg] rounded-[100%_0] border border-[#b67a96]/30 motion-safe:animate-[humorHeroFloat_7s_ease-in-out_infinite]" />
          <span className="absolute bottom-[12%] left-[12%] h-16 w-8 rotate-[35deg] rounded-[100%_0] border border-[#b67a96]/30 motion-safe:animate-[humorHeroFloat_8s_ease-in-out_infinite]" />
          <span className="absolute bottom-[10%] right-[12%] h-12 w-6 rotate-[-28deg] border border-[#b67a96]/30 motion-safe:animate-[humorHeroFloat_7s_ease-in-out_infinite]" />
          <div key={active} className="relative z-10 max-w-[390px] motion-safe:animate-[humorHeroSlide_700ms_ease-out]">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--deep-wine)]">{slide.eyebrow}</p>
            <h1 className="font-display text-4xl leading-[1.08] text-[var(--deep-wine)] md:text-[46px] lg:text-[50px]">{slide.title}</h1>
            <Link href={slide.href} className="mt-7 inline-flex bg-[#8f286f] px-8 py-3.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-[#a63783]">
              {slide.cta}
            </Link>
          </div>
        </div>

        <Link href={slide.rightHref} className="group relative min-h-[430px] overflow-hidden bg-[#dfe0ff] md:min-h-0">
          <img src={slide.rightImage} alt="Humor Luxury product collection" className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-[#7d80ad]/15" />
          <span className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-[#8f286f] px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white opacity-0 shadow-lg transition-all duration-500 group-hover:opacity-100">
            Explore Product
          </span>
        </Link>
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
