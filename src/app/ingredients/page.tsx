const ingredientGroups = [
  { title: "Actives we build around", items: [
    { name: "Niacinamide", note: "Barrier support, tone-evening, oil control" },
    { name: "Vitamin C (Sodium Ascorbyl Phosphate)", note: "Brightening, stable at room temperature" },
    { name: "Salicylic Acid", note: "Gentle exfoliation for congested, acne-prone skin" },
    { name: "Ceramides", note: "Rebuilds the skin barrier" },
    { name: "Hyaluronic Acid", note: "Hydration that doesn't feel heavy" },
  ]},
  { title: "What we leave out, always", items: [
    { name: "Parabens", note: "Preservatives linked to hormone disruption concerns" },
    { name: "Sulphates (SLS/SLES)", note: "Harsh surfactants that strip natural oils" },
    { name: "Animal-derived ingredients", note: "In our cruelty-free lines" },
    { name: "Synthetic dyes", note: "Where they serve no functional purpose" },
  ]},
];

export const metadata = {
  title: "Our Ingredients | Humor Luxury",
  description: "What goes into every Humor Luxury formula, and what we deliberately leave out.",
};

export default function IngredientsPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16">
      <h1 className="font-display text-4xl text-[var(--deep-wine)] mb-6">Our ingredients</h1>
      <p className="text-[var(--ink)]/80 leading-relaxed mb-12">
        Every Humor Luxury product page lists its full ingredient panel — including the complete
        INCI list, not just the ingredients that sound good in marketing. Here&apos;s the
        philosophy behind what makes the cut.
      </p>
      {ingredientGroups.map((group) => (
        <div key={group.title} className="mb-12">
          <h2 className="font-display text-2xl text-[var(--deep-wine)] mb-5">{group.title}</h2>
          <div className="space-y-4">
            {group.items.map((item) => (
              <div key={item.name} className="bg-[var(--milk-sage)] border border-[var(--line)] rounded-xl px-5 py-4">
                <div className="text-sm font-medium text-[var(--ink)]">{item.name}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
