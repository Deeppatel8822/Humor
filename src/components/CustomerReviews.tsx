import { Product } from "@/types/product";
import { getCustomerFeedback } from "@/lib/customerFeedback";

export default function CustomerReviews({ product }: { product: Product }) {
  const reviews = getCustomerFeedback(product);
  return (
    <section className="mb-20">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-[var(--deep-wine)]">Customer reviews</h2>
          <p className="text-xs text-[var(--muted)] mt-1">Sample feedback layout • replace with verified customer feedback before publishing as reviews</p>
        </div>
        <span className="text-xs text-[var(--ink)]/50">{reviews.length} reviews</span>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {reviews.map((review, index) => (
          <article key={index} className="rounded-2xl border border-[var(--line)] bg-[var(--milk-sage)] p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--deep-wine)] text-white flex items-center justify-center text-sm font-medium">{review.name.charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-medium text-[var(--deep-wine)]">{review.name}</p><p className="text-[11px] text-[var(--muted)]">{review.state}</p></div>
                  <div className="text-[var(--warm-gold)] tracking-tight" aria-label={review.rating + " out of 5 stars"}>{"★".repeat(review.rating)}<span className="text-[var(--ink)]/20">{"★".repeat(5 - review.rating)}</span></div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]/85">{review.text}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}