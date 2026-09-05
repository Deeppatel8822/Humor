"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";

const options = [
  { key: "acne", label: "Acne / Blemishes" },
  { key: "dry-pigmentation", label: "Dry / Pigmentation" },
  { key: "brightening", label: "Whitening / Brightening" },
  { key: "hair", label: "Hair Care" },
  { key: "sun", label: "Sun Protection" },
  { key: "body", label: "Body Care" },
];

type RoutineStep = {
  step: string;
  title: string;
  productSlug?: string;
  description: string;
  howToUse: string;
  why: string;
};

const routineSteps: Record<string, RoutineStep[]> = {
  acne: [
    {
      step: "01",
      title: "Cleanse",
      productSlug: "blemish-block-face-wash",
      description:
        "Start by gently cleansing your skin with Blemish Block Face Wash.",
      howToUse:
        "Wet your face, apply a small amount and gently massage for 30–60 seconds. Rinse thoroughly and pat dry.",
      why:
        "Cleansing removes daily buildup and prepares your skin for the treatment step.",
    },
    {
      step: "02",
      title: "Treat",
      productSlug: "blemish-block-face-serum",
      description:
        "Follow with Blemish Block Face Serum as your targeted treatment step.",
      howToUse:
        "Apply a few drops to clean, dry skin and gently press or massage until absorbed.",
      why:
        "The treatment step focuses your routine on acne-prone and blemish-prone skin.",
    },
    {
      step: "03",
      title: "Protect",
      productSlug: "sunscreen-spf-50",
      description:
        "Finish your morning routine with Sunscreen SPF 50 PA++++.",
      howToUse:
        "Apply generously as the final step of your morning skincare routine before sun exposure. Reapply during prolonged outdoor exposure.",
      why:
        "Daily sun protection helps protect your skin while you maintain your skincare routine.",
    },
  ],

  "dry-pigmentation": [
    {
      step: "01",
      title: "Cleanse",
      productSlug: "velvet-touch-face-wash",
      description:
        "Begin with Velvet Touch Face Wash to gently cleanse and prepare your skin.",
      howToUse:
        "Wet your face, apply a small amount and gently massage for 30–60 seconds. Rinse well and pat dry.",
      why:
        "Clean skin creates a fresh base for the treatment step that follows.",
    },
    {
      step: "02",
      title: "Treat",
      productSlug: "velvet-touch-face-serum",
      description:
        "Follow with Velvet Touch Face Serum as your targeted skincare step.",
      howToUse:
        "Apply a few drops to clean, dry skin and gently press until absorbed.",
      why:
        "The serum adds a focused treatment step to your daily skincare ritual.",
    },
    {
      step: "03",
      title: "Protect",
      productSlug: "sunscreen-spf-50",
      description:
        "Complete your morning routine with Sunscreen SPF 50 PA++++.",
      howToUse:
        "Apply generously as the final step before sun exposure. Reapply when spending extended time outdoors.",
      why:
        "Daily sun protection is an important part of maintaining healthy-looking skin.",
    },
  ],

  brightening: [
    {
      step: "01",
      title: "Cleanse",
      productSlug: "fullmoon-face-wash",
      description:
        "Start with Fullmoon Face Wash to gently cleanse and prepare your skin.",
      howToUse:
        "Wet your face, apply a small amount and gently massage for 30–60 seconds. Rinse well and pat dry.",
      why:
        "Clean skin provides a fresh base for your brightening routine.",
    },
    {
      step: "02",
      title: "Treat",
      productSlug: "fullmoon-face-serum",
      description:
        "Follow with Fullmoon Face Serum as your targeted brightening step.",
      howToUse:
        "Apply a few drops to clean, dry skin and gently press until absorbed.",
      why:
        "The serum adds a focused treatment step to your everyday skincare ritual.",
    },
    {
      step: "03",
      title: "Protect",
      productSlug: "sunscreen-spf-50",
      description:
        "Finish with Sunscreen SPF 50 PA++++ every morning.",
      howToUse:
        "Apply generously as the final skincare step before sun exposure. Reapply during prolonged outdoor exposure.",
      why:
        "Daily sun protection is essential when caring for a bright, even-looking complexion.",
    },
  ],

  hair: [
    {
      step: "01",
      title: "Cleanse",
      productSlug: "repair-shampoo",
      description:
        "Start your haircare routine by cleansing your scalp and hair with Repair Shampoo.",
      howToUse:
        "Apply to wet hair and scalp. Massage gently with your fingertips, then rinse thoroughly.",
      why:
        "A clean scalp and hair create the foundation for the rest of your haircare routine.",
    },
    {
      step: "02",
      title: "Condition",
      productSlug: "repair-conditioner",
      description:
        "Follow with Repair Conditioner through the lengths of your hair.",
      howToUse:
        "Apply mainly to the mid-lengths and ends. Leave briefly, then rinse thoroughly.",
      why:
        "Conditioning helps leave the hair feeling smoother and easier to manage.",
    },
    {
      step: "03",
      title: "Deep Repair",
      productSlug: "repair-hair-mask",
      description:
        "Use Repair Hair Mask as your deeper haircare step.",
      howToUse:
        "Apply to clean, damp hair, focusing on lengths and ends. Leave according to product directions, then rinse.",
      why:
        "A hair mask adds an extra deep-care step to your regular haircare ritual.",
    },
  ],

  sun: [
    {
      step: "01",
      title: "Cleanse",
      productSlug: "velvet-touch-face-wash",
      description:
        "Start your morning routine with a clean face.",
      howToUse:
        "Wet your face, apply a small amount and gently massage for 30–60 seconds. Rinse and pat dry.",
      why:
        "Clean skin provides a fresh base for your daytime routine.",
    },
    {
      step: "02",
      title: "Protect",
      productSlug: "sunscreen-spf-50",
      description:
        "Finish with Sunscreen SPF 50 PA++++ as your daily protection step.",
      howToUse:
        "Apply generously as the final step of your morning skincare routine before sun exposure. Reapply during prolonged outdoor exposure.",
      why:
        "Sunscreen is the essential protection step in a daytime skincare routine.",
    },
  ],

  body: [
    {
      step: "01",
      title: "Cleanse",
      productSlug: "shower-gel",
      description:
        "Begin your bodycare routine with Shower Gel.",
      howToUse:
        "Apply to wet skin, gently cleanse the body and rinse thoroughly.",
      why:
        "Cleansing removes daily dirt, sweat and buildup from the skin.",
    },
  ],
};

export default function RoutineBuilder({
  products,
  initialRoutine = null,
}: {
  products: Product[];
  initialRoutine?: string | null;
}) {
  const [selected, setSelected] = useState<string | null>(initialRoutine);

  const steps = selected ? routineSteps[selected] ?? [] : [];
  const selectedOption = options.find((o) => o.key === selected);

  const getProduct = (slug?: string) => {
    if (!slug) return null;
    return products.find((p) => p.slug === slug) ?? null;
  };

  return (
    <div id="routine" className="scroll-mt-28">

      {/* ROUTINE OPTIONS */}
      <section className="mb-14">

        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--warm-gold)] font-semibold mb-3">
          Choose Your Goal
        </div>

        <h2 className="font-display text-2xl md:text-3xl text-[var(--deep-wine)] mb-3">
          Find the routine that fits you
        </h2>

        <p className="text-[var(--muted)] max-w-2xl mb-7">
          Choose what you want to focus on and we’ll guide you through a
          simple step-by-step routine.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelected(option.key)}
              className={`text-left px-5 py-4 rounded-xl border transition-all ${
                selected === option.key
                  ? "border-[var(--deep-wine)] bg-[var(--milk-sage)] text-[var(--deep-wine)] shadow-sm"
                  : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--deep-wine)]/40 hover:bg-[var(--milk-sage)]/50"
              }`}
            >
              <span className="text-sm font-medium">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* SELECTED ROUTINE */}
      {selectedOption && steps.length > 0 && (
        <section>

          {/* HEADER */}
          <div className="border-t border-[var(--line)] pt-10 mb-10">

            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--warm-gold)] font-semibold mb-3">
              Your Recommended Routine
            </div>

            <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-3">
              {selectedOption.label}
            </h2>

            <p className="text-[var(--muted)] max-w-2xl leading-6">
              Follow these steps in order. Each product has a specific role
              in your daily beauty ritual.
            </p>

          </div>

          {/* STEP FLOW */}
          <div className="space-y-10">

            {steps.map((step, index) => {
              const product = getProduct(step.productSlug);

              return (
                <div
                  key={step.step}
                  className="relative grid md:grid-cols-[1fr_300px] gap-8 md:gap-12 items-start"
                >

                  {/* LEFT SIDE */}
                  <div className="relative">

                    <div className="flex items-center gap-4 mb-5">

                      <div className="w-11 h-11 rounded-full bg-[var(--deep-wine)] text-white flex items-center justify-center text-xs font-medium shrink-0">
                        {step.step}
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--warm-gold)] font-semibold">
                          Step {step.step}
                        </div>

                        <h3 className="font-display text-2xl text-[var(--deep-wine)]">
                          {step.title}
                        </h3>
                      </div>

                    </div>

                    {/* CONNECTOR */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute left-[21px] top-[56px] h-[calc(100%+40px)] w-px bg-[var(--line)]" />
                    )}

                    <div className="md:pl-[60px]">

                      <p className="text-sm text-[var(--muted)] leading-6 mb-7 max-w-xl">
                        {step.description}
                      </p>

                      <div className="grid sm:grid-cols-2 gap-5">

                        {/* HOW TO USE */}
                        <div className="rounded-xl bg-[var(--milk-sage)]/50 p-5">

                          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--deep-wine)] font-semibold mb-2">
                            How to use
                          </div>

                          <p className="text-sm text-[var(--muted)] leading-6">
                            {step.howToUse}
                          </p>

                        </div>

                        {/* WHY */}
                        <div className="rounded-xl border border-[var(--line)] p-5">

                          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--deep-wine)] font-semibold mb-2">
                            Why this step
                          </div>

                          <p className="text-sm text-[var(--muted)] leading-6">
                            {step.why}
                          </p>

                        </div>

                      </div>
                    </div>
                  </div>

                  {/* RIGHT SIDE PRODUCT */}
                  {product && (
                    <div className="md:pt-1">

                      <div className="rounded-2xl border border-[var(--line)] bg-white p-3 shadow-sm">

                        <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--warm-gold)] font-semibold px-2 pt-1 pb-3">
                          Recommended Product
                        </div>

                        <div className="max-w-[220px] mx-auto">
                          <ProductCard product={product} />
                        </div>

                      </div>

                    </div>
                  )}

                </div>
              );
            })}

          </div>

          {/* WHY THIS ORDER */}
          <div className="mt-14 rounded-2xl bg-[var(--deep-wine)] text-white p-7 md:p-10">

            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--warm-gold)] font-semibold mb-3">
              Why this order?
            </div>

            <h3 className="font-display text-2xl md:text-3xl mb-5">
              Cleanse → Treat → Protect
            </h3>

            <p className="text-white/75 max-w-2xl leading-7">
              Start with clean skin, follow with your targeted treatment,
              and finish with protection. A simple and consistent routine
              makes it easier to build a daily beauty ritual.
            </p>

          </div>

          {/* SHOP ROUTINE */}
          <div className="mt-10 text-center">

            <p className="text-sm text-[var(--muted)] mb-4">
              Ready to make this routine part of your daily ritual?
            </p>

            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("routine-products")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center justify-center rounded-full border border-[var(--deep-wine)] px-7 py-3 text-sm font-medium text-[var(--deep-wine)] hover:bg-[var(--deep-wine)] hover:text-white transition-colors"
            >
              Shop This Routine ↓
            </button>

          </div>

          {/* PRODUCTS */}
          <div
            id="routine-products"
            className="mt-12 scroll-mt-28"
          >

            <h3 className="font-display text-2xl text-[var(--deep-wine)] mb-6">
              Products in your routine
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {steps.map((step) => {
                const product = getProduct(step.productSlug);

                if (!product) return null;

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                );
              })}
            </div>

          </div>

        </section>
      )}

      {/* EMPTY STATE */}
      {!selected && (
        <div className="border border-dashed border-[var(--line)] rounded-2xl p-10 text-center">

          <h3 className="font-display text-2xl text-[var(--deep-wine)] mb-2">
            Your routine starts here
          </h3>

          <p className="text-sm text-[var(--muted)]">
            Select a goal above to discover your step-by-step routine.
          </p>

        </div>
      )}

    </div>
  );
}
