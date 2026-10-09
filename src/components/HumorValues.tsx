"use client";

import { useEffect, useRef, useState } from "react";

const brandValues = [
  {
    letter: "H",
    title: "Honest Beauty",
    description:
      "Honest choices, thoughtful formulas and clear communication you can feel confident about.",
  },
  {
    letter: "U",
    title: "Uncomplicated Care",
    description:
      "Everyday skincare, haircare and bodycare made to fit naturally into your routine.",
  },
  {
    letter: "M",
    title: "Mindful Formulations",
    description:
      "Purposeful ingredients and considered formulas, created with real everyday needs in mind.",
  },
  {
    letter: "O",
    title: "Original You",
    description:
      "Beauty is personal. We are here to complement your routine, not change who you are.",
  },
  {
    letter: "R",
    title: "Real Everyday Rituals",
    description:
      "Premium-feeling care that celebrates consistency over complicated routines.",
  },
];

export default function HumorValues() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [started, setStarted] = useState(false);
  const [typedTitles, setTypedTitles] = useState<string[]>(
    brandValues.map(() => "")
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || started) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    brandValues.forEach((item, index) => {
      const title = item.title;
      const delay = index * 420;
      const startTimer = setTimeout(() => {
        let character = 0;
        const typeNext = () => {
          character += 1;
          setTypedTitles((current) =>
            current.map((value, titleIndex) =>
              titleIndex === index ? title.slice(0, character) : value
            )
          );
          if (character < title.length) {
            const timer = setTimeout(typeNext, 60);
            timers.push(timer);
          }
        };
        typeNext();
      }, delay);
      timers.push(startTimer);
    });

    return () => timers.forEach(clearTimeout);
  }, [started]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="humor-values-heading"
      className="relative overflow-hidden border-y border-[var(--line)] bg-[var(--ink)] text-[var(--milk-sage)]"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--warm-gold)]">
            The Meaning Behind Our Name
          </p>
          <h2
            id="humor-values-heading"
            className="font-display text-3xl leading-tight md:text-5xl"
          >
            Five letters. One beauty philosophy.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
            HUMOR is more than a name. It is a reminder of the values we bring
            to your everyday beauty ritual.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
          {brandValues.map((item, index) => {
            const isTyped = typedTitles[index].length === item.title.length;
            return (
              <article
                key={item.letter}
                className="group relative min-h-[250px] overflow-hidden rounded-2xl border border-white/15 bg-white/[0.035] p-6 transition duration-700 hover:-translate-y-1 hover:border-[var(--warm-gold)]/70 hover:bg-white/[0.07] md:min-h-[300px] md:p-7"
                style={{
                  opacity: started ? 1 : 0,
                  transform: started ? "translateY(0)" : "translateY(18px)",
                  transitionDelay: `${index * 180}ms`,
                }}
              >
                <div className="mb-7 flex items-start justify-between">
                  <span
                    className="font-display text-6xl leading-none text-[var(--warm-gold)] md:text-7xl"
                    aria-hidden="true"
                  >
                    {started ? item.letter : ""}
                  </span>
                  <span className="pt-2 text-[10px] tracking-[0.2em] text-white/35">
                    0{index + 1} / 05
                  </span>
                </div>

                <h3 className="min-h-[3.5rem] font-display text-xl leading-snug text-white md:text-2xl">
                  {typedTitles[index]}
                  {started && !isTyped && (
                    <span
                      className="ml-0.5 inline-block h-[1em] w-px translate-y-0.5 animate-pulse bg-[var(--warm-gold)]"
                      aria-hidden="true"
                    />
                  )}
                </h3>
                <p
                  className="mt-4 text-sm leading-6 text-white/60 transition-opacity duration-700"
                  style={{ opacity: isTyped ? 1 : 0 }}
                >
                  {item.description}
                </p>
                <div className="absolute bottom-0 left-6 right-6 h-px origin-left scale-x-0 bg-[var(--warm-gold)]/70 transition-transform duration-700 group-hover:scale-x-100 md:left-7 md:right-7" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
