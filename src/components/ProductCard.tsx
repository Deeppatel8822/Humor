import Link from "next/link";
import { Product } from "@/types/product";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-star" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 20 20" fill={i <= Math.round(rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1">
          <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6L1.3 7.7l6.1-.6z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const onSale =
    product.compare_at_price_inr && product.compare_at_price_inr > product.price_inr;
  const discountPct = onSale
    ? Math.round(100 - (product.price_inr / product.compare_at_price_inr!) * 100)
    : 0;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] rounded-lg bg-[var(--milk-sage)] mb-3 flex items-center justify-center overflow-hidden border border-[var(--line)]">
        <span className="font-display text-lg text-[var(--deep-wine)]/25 px-4 text-center">
          {product.name}
        </span>
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {product.is_bestseller && (
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-[var(--deep-wine)] text-white px-2 py-1 rounded">
              Best Seller
            </span>
          )}
          {product.is_new && (
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-[var(--ink)] text-white px-2 py-1 rounded">
              New
            </span>
          )}
          {onSale && (
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-white text-[var(--deep-wine)] px-2 py-1 rounded border border-[var(--line)]">
              {discountPct}% off
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-1">
        <Stars rating={product.rating} />
        <span className="text-[11px] text-[var(--muted)]">
          {product.rating} ({product.review_count})
        </span>
      </div>

      <div className="text-sm font-medium text-[var(--ink)] group-hover:text-[var(--deep-wine)] leading-snug">
        {product.name}
      </div>
      {product.tagline && (
        <div className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">{product.tagline}</div>
      )}

      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-sm font-semibold text-[var(--ink)]">
          &#8377;{product.price_inr}
        </span>
        {onSale && (
          <span className="text-xs text-[var(--muted)] line-through">
            &#8377;{product.compare_at_price_inr}
          </span>
        )}
      </div>
      {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
        <div className="text-xs text-[var(--dusty-rose)] mt-1">
          Only {product.stock_quantity} left
        </div>
      )}
    </Link>
  );
}
