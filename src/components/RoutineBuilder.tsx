"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";

const options = [
  {
    key: "acne",
    label: "Acne & Blemishes",
  },
  {
    key: "dry",
    label: "Dry & Dull Skin",
  },
  {
    key: "brightening",
    label: "Pigmentation / Brightening",
  },
  {
    key: "everyday",
    label: "Everyday Skin Care",
  },
  {
    key: "hair",
    label: "Hair Care",
  },
  {
    key: "body",
    label: "Body Care",
  },
  {
    key: "sun",
    label: "Sun Protection",
  },
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
        "Start with a gentle cleanse to remove excess oil, dirt and daily buildup.",
      howToUse:
        "Wet your face, apply a small amount and gently massage for 30–60 seconds. Rinse thoroughly and pat dry.",
      why:
        "A clean skin surface prepares your face for the next skincare step.",
    },
    {
      step: "02",
      title: "Treat",
      productSlug: "blemish-block-face-serum",
      description:
        "Follow with your targeted serum as the treatment step.",
      howToUse:
        "Apply a few drops to clean, dry skin and gently press or massage until absorbed.",
      why:
        "The treatment step focuses your routine on your specific skin concern.",
    },
    {
      step: "03",
      title: "Protect",
      productSlug: "sunscreen-spf-50",
      description:
        "Finish your morning routine with broad-spectrum sun protection.",
      howToUse:
        "Apply generously as the final step of your morning skincare routine. Reapply during prolonged outdoor exposure.",
      why:
        "Daily sun protection helps protect your skin while maintaining your skincare routine.",
    },
  ],

  dry: [
    {
      step: "01",
      title: "Cleanse",
      productSlug: "fullmoon-face-wash",
      description:
        "Begin with a gentle cleanse designed for a comfortable everyday skincare ritual.",
      howToUse:
        "Wet your face, apply a small amount and massage gently for 30–60 seconds. Rinse and pat dry.",
      why:
        "Cleansing removes daily buildup while preparing your skin for treatment.",
    },
    {
      step: "02",
      title: "Treat",
      productSlug: "fullmoon-face-serum",
      description:
        "Apply your serum after cleansing to continue your targeted skincare routine.",
      howToUse:
        "Apply a few drops to clean, dry skin and gently press until absorbed.",
      why:
        "Serum is the concentrated treatment step of your routine.",
    },
    {
      step: "03",
      title: "Protect",
      productSlug: "sunscreen-spf-50",
      description:
        "Complete your morning routine with daily sun protection.",
      howToUse:
        "Apply generously as the final step before sun exposure. Reapply when spending extended time outdoors.",
      why:
        "Protection is an essential part of a complete daytime skincare routine.",
    },
  ],

  brightening: [
    {
      step: "01",
      title: "Cleanse",
      productSlug: "velvet-touch-face-wash",
      description:
        "Start with Velvet Touch Face Wash to cleanse and prepare your skin.",
      howToUse:
        "Wet your face, apply a small amount and gently massage for 30–60 seconds. Rinse well and pat dry.",
      why:
        "Clean skin allows the next skincare step to be applied more effectively.",
    },
    {
      step: "02",
      title: "Treat",
      productSlug: "velvet-touch-face-serum",
      description:
        "Apply Velvet Touch Face Serum as your targeted treatment step.",
      howToUse:
        "Apply a few drops to clean, dry skin. Gently spread and allow the serum to absorb.",
      why:
        "The serum adds a targeted treatment step to your daily routine.",
    },
    {
      step: "03",
      title: "Protect",
      productSlug: "sunscreen-spf-50",
      description:
        "Finish with SPF 50 PA++++ every morning.",
      howToUse:
        "Apply generously as the final step of your morning skincare routine. Reapply during prolonged sun exposure.",
      why:
        "Daily sun protection is important when maintaining a bright, even-looking complexion.",
    },
  ],

  everyday: [
    {
      step: "01",
      title: "Cleanse",
      productSlug: "velvet-touch-face-wash",
      description:
        "Begin with Velvet Touch Face Wash for your everyday cleanse.",
      howToUse:
        "Wet your face, massage a small amount gently for 30–60 seconds, then rinse and pat dry.",
      why:
        "Cleansing creates a fresh base for the rest of your routine.",
    },
    {
      step: "02",
      title: "Treat",
      productSlug: "velvet-touch-face-serum",
      description:
        "Follow with Velvet Touch Face Serum.",
      howToUse:
        "Apply a few drops to clean, dry skin and gently press until absorbed.",
      why:
        "Serum adds a focused treatment step to your everyday ritual.",
    },
    {
      step: "03",
      title: "Protect",
      productSlug: "sunscreen-spf-50",
      description:
        "Finish your morning routine with SPF 50 PA++++.",
      howToUse:
        "Apply generously as the final skincare step before sun exposure.",
      why:
        "Sun protection completes your daytime skincare routine.",
    },
  ],

  hair: [
    {
      step: "01",
      title: "Cleanse",
      productSlug: "repair-shampoo",
      description:
        "Start by cleansing your scalp and hair with Repair Shampoo.",
      howToUse:
        "Apply to wet hair and scalp. Massage gently, then rinse thoroughly.",
      why:
        "A clean scalp and hair create the foundation for your haircare routine.",
    },
    {
      step: "02",
      title: "Condition",
      productSlug: "repair-conditioner",
      description:
        "Follow with Repair Conditioner through the lengths of your hair.",
      howToUse:
        "Apply mainly to mid-lengths and ends. Leave briefly, then rinse thoroughly.",
      why:
        "Conditioning helps leave the hair feeling smoother and easier to manage.",
    },
    {
      step: "03",
      title: "Deep Repair",
      productSlug: "repair-hair-mask",
      description:
        "Use the Repair Hair Mask as your deeper care step.",
      howToUse:
        "Apply to clean, damp hair, focusing on lengths and ends. Leave according to the product directions, then rinse.",
      why:
        "A hair mask adds a deeper care step to your regular haircare ritual.",
    },
  ],

  body: [
    {
      step: "01",
      title: "Cleanse",
      productSlug: "shower-gel",
      description:
        "Begin your body routine with Shower Gel.",
      howToUse:
        "Apply to wet skin, gently cleanse the body and rinse thoroughly.",
      why:
        "Cleansing removes daily dirt, sweat and buildup from the skin.",
    },
  ],

  sun: [
    {
      step: "01",
      title: "Cleanse",
      productSlug: "velvet-touch-face-wash",
      description:
        "Start with a clean face.",
      howToUse:
        "Wet your face, massage gently for 30–60 seconds, rinse and pat dry.",
      why:
        "Clean skin provides a fresh base for your morning routine.",
    },
    {
      step: "02",
      title: "Protect",
      productSlug: "sunscreen-spf-50",
      description:
        "Finish with SPF 50 PA++++.",
      howToUse:
        "Apply generously as the final step of your morning skincare routine before sun exposure.",
      why:
        "Daily sunscreen is the key protection step in a daytime skincare routine.",
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

  const getProduct = (slug?: string) => {
    if (!slug) return null;
    return products.find((p) => p.slug === slug) ?? null;
  };

  const selectedOption = options.find((o) => o.key === selected);

  return (
    <div id="routine" className="scroll-mt-28">

      {/* Goal Selection */}
      <div className="mb-12">
        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--warm-gold)] font-semibold mb-3">
          Step 01
        </div>

        <h2 className="font-display text-2xl md:text-3xl text-[var(--deep-wine)] mb-3">
          Choose your beauty goal
        </h2>

        <p className="text-[var(--muted)] mb-6">
          Tell us what you want to focus on and we’ll guide you through a
          simple product routine.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => setSelected(o.key)}
              className={`text-left px-5 py-4 rounded-xl border transition-all ${
                selected === o.key
                  ? "border-[var(--deep-wine)] bg-[var(--milk-sage)] text-[var(--deep-wine)] shadow-sm"
                  : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--deep-wine)]/40 hover:bg-[var(--milk-sage)]/50"
              }`}
            >
              <span className="text-sm font-medium">{o.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Routine */}
      {selectedOption && steps.length > 0 && (
        <div>

          {/* Routine Header */}
          <div className="border-t border-[var(--line)] pt-10 mb-10">
            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--warm-gold)] font-semibold mb-3">
              Your Personalized Routine
            </div>

            <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-3">
              {selectedOption.label}
            </h2>

            <p className="text-[var(--muted)] max-w-2xl">
              Follow these steps in order. Each step has a specific role in
              creating a simple, consistent beauty ritual.
            </p>
          </div>

          {/* Routine Flow */}
          <div className="space-y-10">
            {steps.map((step, index) => {
              const product = getProduct(step.productSlug);

              return (
                <div key={step.step}>

                  <div className="grid md:grid-cols-[80px_1fr] gap-5">

                    {/* Step Number */}
                    <div className="hidden md:flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[var(--deep-wine)] text-white flex items-center justify-center text-sm font-medium">
                        {step.step}
                      </div>

                      {index < steps.length - 1 && (
                        <div className="w-px flex-1 bg-[var(--line)] mt-3" />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="border border-[var(--line)] rounded-2xl overflow-hidden">

                      <div className="p-6 md:p-7 bg-[var(--milk-sage)]/40">

                        <div className="flex items-center gap-3 mb-2">
                          <span className="md:hidden text-xs font-semibold text-[var(--warm-gold)]">
                            STEP {step.step}
                          </span>

                          <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--warm-gold)] font-semibold">
                            {step.title}
                          </span>
                        </div>

                        {product && (
                          <h3 className="font-display text-2xl text-[var(--deep-wine)] mb-2">
                            {product.name}
                          </h3>
                        )}

                        <p className="text-sm text-[var(--muted)] leading-6">
                          {step.description}
                        </p>
                      </div>

                      <div className="p-6 md:p-7 grid md:grid-cols-2 gap-6">

                        <div>
                          <div className="text-xs uppercase tracking-[0.12em] text-[var(--deep-wine)] font-semibold mb-2">
                            How to use
                          </div>

                          <p className="text-sm text-[var(--muted)] leading-6">
                            {step.howToUse}
                          </p>
                        </div>

                        <div>
                          <div className="text-xs uppercase tracking-[0.12em] text-[var(--deep-wine)] font-semibold mb-2">
                            Why this step
                          </div>

                          <p className="text-sm text-[var(--muted)] leading-6">
                            {step.why}
                          </p>
                        </div>

                      </div>

                      {product && (
                        <div className="border-t border-[var(--line)] p-5 md:p-6">
                          <ProductCard product={product} />
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Why This Order */}
          <div className="mt-14 rounded-2xl bg-[var(--deep-wine)] text-white p-7 md:p-10">

            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--warm-gold)] font-semibold mb-3">
              Why this order?
            </div>

            <h3 className="font-display text-2xl md:text-3xl mb-5">
              Cleanse → Treat → Protect
            </h3>

            <p className="text-white/75 max-w-2xl leading-7">
              Start with clean skin, follow with your targeted treatment, and
              finish with protection. Keeping the routine simple and
              consistent makes it easier to follow every day.
            </p>

          </div>

          {/* Routine CTA */}
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

          {/* Routine Products */}
          <div id="routine-products" className="mt-12 scroll-mt-28">

            <h3 className="font-display text-2xl text-[var(--deep-wine)] mb-6">
              Products in your routine
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {steps.map((step) => {
                const product = getProduct(step.productSlug);

                if (!product) return null;

                return (
                  <ProductCard key={product.id} product={product} />
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* Empty State */}
      {!selected && (
        <div className="border border-dashed border-[var(--line)] rounded-2xl p-10 text-center">
          <h3 className="font-display text-2xl text-[var(--deep-wine)] mb-2">
            Your routine starts here
          </h3>

          <p className="text-sm text-[var(--muted)]">
            Select a beauty goal above to see your step-by-step routine.
          </p>
        </div>
      )}
    </div>
  );
}
