"use client";

import { useEffect, useState } from "react";

const facts = [
  { value: 11, suffix: "", label: "Products, 3 Categories", icon: "✦" },
  { value: 100, suffix: "%", label: "Cruelty Free", icon: "♡" },
  { value: 0, suffix: "", label: "Parabens / Sulphates", icon: "◌" },
  { value: 0, suffix: "", label: "Proudly Made In", text: "India", icon: "✿" },
];

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) return;

    let frame = 0;
    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{count}{suffix}</>;
}

export default function TrustFacts() {
  return (
    <section className="bg-[var(--milk-sage)] border-y border-[var(--line)] py-14 md:py-16">
      <div className="max-w-7xl mx-auto px-5 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 text-center">
        {facts.map((fact) => (
          <div key={fact.label} className="group">
            <div
              aria-hidden="true"
              className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--warm-gold)]/45 text-lg text-[var(--warm-gold)] transition-transform duration-300 group-hover:scale-110"
            >
              {fact.icon}
            </div>
            <div className="font-display text-2xl md:text-3xl text-[var(--deep-wine)] mb-1 tabular-nums">
              {fact.text ? fact.text : <CountUp value={fact.value} suffix={fact.suffix} />}
            </div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-wide">{fact.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
