import { getAllProducts } from "@/lib/catalog";
import RoutineBuilder from "@/components/RoutineBuilder";

export const metadata = {
  title: "Build Your Routine | Humor Luxury",
  description: "Answer a few questions and get a recommended Humor Luxury routine.",
};

export default async function BuildYourRoutinePage() {
  const products = await getAllProducts();

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-8 py-16">
      <h1 className="font-display text-4xl text-[var(--deep-wine)] mb-3">Build your routine</h1>
      <p className="text-[var(--muted)] mb-10">
        This is a guided starting point based on what you tell us — not a diagnosis. For persistent
        skin or hair concerns, please see a dermatologist.
      </p>
      <RoutineBuilder products={products} />
    </div>
  );
}
