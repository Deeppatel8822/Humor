import { getAllProducts } from "@/lib/catalog";
import RoutineBuilder from "@/components/RoutineBuilder";

export const metadata = {
  title: "Build Your Routine | Humor Luxury",
  description:
    "Discover a simple, guided Humor Luxury skincare, haircare and bodycare routine based on your beauty goal.",
};

export default async function BuildYourRoutinePage({
  searchParams,
}: {
  searchParams: Promise<{ routine?: string }>;
}) {
  const { routine } = await searchParams;
  const products = await getAllProducts();

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-14 md:py-16">

      {/* Page Header */}
      <div className="max-w-3xl mb-12">

        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--warm-gold)] font-semibold mb-3">
          Humor Luxury
        </div>

        <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-4">
          Build Your Routine
        </h1>

        <p className="text-[var(--muted)] leading-7">
          Great skincare is not about using more products. It is about using
          the right products in the right order, consistently.
        </p>

      </div>

      {/* Routine Builder */}
      <RoutineBuilder
        products={products}
        initialRoutine={routine ?? null}
      />

      {/* Disclaimer */}
      <div className="mt-14 pt-6 border-t border-[var(--line)]">
        <p className="text-xs text-[var(--muted)] leading-5">
          This routine is a general beauty-care guide and is not a medical
          diagnosis or treatment plan. For persistent or severe skin or hair
          concerns, please consult a qualified dermatologist.
        </p>
      </div>

    </div>
  );
}
