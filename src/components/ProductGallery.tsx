"use client";

import { useState } from "react";

export type GalleryImage = {
  src: string;
  alt: string;
};

export default function ProductGallery({ images }: { images: GalleryImage[] }) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) return null;

  const active = images[selected] ?? images[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[88px_1fr] gap-3 md:gap-4 min-w-0">
      <div className="order-2 md:order-1 flex md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-visible max-w-full">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onMouseEnter={() => setSelected(index)}
            onFocus={() => setSelected(index)}
            onClick={() => setSelected(index)}
            aria-label={`View ${image.alt}`}
            className={`block shrink-0 w-[68px] h-[68px] md:w-full md:h-auto md:aspect-square overflow-hidden rounded-xl md:rounded-2xl border bg-white transition-all ${
              index === selected
                ? "border-[var(--warm-gold)] ring-1 ring-[var(--warm-gold)]/30"
                : "border-[var(--line)] hover:border-[var(--warm-gold)]/60"
            }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-contain p-1 rounded-xl md:rounded-2xl"
            />
          </button>
        ))}
      </div>

      <div className="order-1 md:order-2 w-full max-w-[420px] md:max-w-none mx-auto aspect-square rounded-2xl md:rounded-[28px] overflow-hidden bg-white flex items-center justify-center">
        <img
          src={active.src}
          alt={active.alt}
          className="block w-full h-full object-contain p-3 md:p-5 rounded-2xl md:rounded-[28px] transition-opacity duration-200"
        />
      </div>
    </div>
  );
}
