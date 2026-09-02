export const metadata = {
  title: "Journal | Humor Luxury",
  description: "Skincare and haircare guides, ingredient explainers, and beauty tips from Humor Luxury.",
};

const categories = ["Skincare", "Haircare", "Ingredients", "Beauty Routines", "Product Guides", "Beauty Tips"];

export default function JournalPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-16">
      <h1 className="font-display text-4xl text-[var(--deep-wine)] mb-3">Journal</h1>
      <p className="text-[var(--muted)] mb-10">
        Guides on ingredients, routines, and everyday skincare — content coming soon.
      </p>
      <div className="flex flex-wrap gap-2 mb-14">
        {categories.map((c) => (
          <span key={c} className="text-xs px-3 py-1.5 rounded-full bg-[var(--milk-sage)] border border-[var(--line)] text-[var(--deep-wine)]">
            {c}
          </span>
        ))}
      </div>
      <div className="bg-[var(--milk-sage)] border border-[var(--line)] rounded-2xl p-10 text-center text-sm text-[var(--muted)]">
        No articles published yet. Each post will include an SEO title, featured image, author, read time,
        and related products once content is ready.
      </div>
    </div>
  );
}
