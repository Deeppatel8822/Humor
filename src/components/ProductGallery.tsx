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
    <div className="grid grid-cols-1 md:grid-cols-[88px_1fr] gap-4">
      <div className="order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-visible">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onMouseEnter={() => setSelected(index)}
            onFocus={() => setSelected(index)}
            onClick={() => setSelected(index)}
            aria-label={`View ${image.alt}`}
            className={`block shrink-0 aspect-square overflow-hidden rounded-xl border bg-white transition-all ${
              index === selected
                ? "border-[var(--warm-gold)] ring-1 ring-[var(--warm-gold)]/30"
                : "border-[var(--line)] hover:border-[var(--warm-gold)]/60"
            }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-contain p-1"
            />
          </button>
        ))}
      </div>

      <div className="order-1 md:order-2 aspect-square rounded-3xl overflow-hidden bg-[var(--milk-sage)] flex items-center justify-center">
        <img
          src={active.src}
          alt={active.alt}
          className="w-full h-full object-contain p-5 transition-opacity duration-200"
        />
      </div>
    </div>
  );
}
