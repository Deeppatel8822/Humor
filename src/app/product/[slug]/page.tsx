import { notFound } from "next/navigation";
import { getProduct, getAllProducts } from "@/lib/catalog";
import { getProducts as getLocalProducts } from "@/lib/products";
import AddToCartForm from "@/components/AddToCartForm";
import ProductCard from "@/components/ProductCard";
import CompleteRoutineButton from "@/components/AddBundleButton";

// Static params come from the local fixture only — Shopify products render
// on-demand (ISR) since the catalog can change without a redeploy.
export async function generateStaticParams() {
  return getLocalProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: `${product.name} | Humor Luxury`,
    description: product.tagline ?? product.description.slice(0, 155),
  };
}

const genericFaqs = [
  {
    q: "Is this suitable for sensitive skin?",
    a: "Our formulas avoid parabens and sulphates, but we always recommend a patch test 24 hours before first full use, especially if you have known sensitivities.",
  },
  {
    q: "How long until I see results?",
    a: "Most customers notice a difference within 2–4 weeks of consistent use. Skincare works cumulatively, so daily use matters more than any single application.",
  },
  {
    q: "What's your return policy?",
    a: "Unopened products can be returned within 7 days of delivery. Opened products are covered under our satisfaction guarantee — reach out to our support team.",
  },
];

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return notFound();

  const allProducts = await getAllProducts();
  const related = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);
  const routinePartner = product.subrange
    ? allProducts.find((p) => p.subrange === product.subrange && p.id !== product.id)
    : undefined;

  const onSale =
    product.compare_at_price_inr && product.compare_at_price_inr > product.price_inr;

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-14">
      {/* Breadcrumb */}
      <nav className="text-xs text-[var(--ink)]/50 mb-8 flex gap-2">
        <a href="/" className="hover:underline">Home</a>
        <span>/</span>
        <a href="/shop" className="hover:underline">Shop</a>
        <span>/</span>
        <span className="text-[var(--deep-wine)]">{product.name}</span>
      </nav>

      {/* Top: image + buy box */}
      <div className="grid md:grid-cols-2 gap-12 mb-20">
        <div className="aspect-square rounded-3xl bg-[var(--milk-sage)] flex items-center justify-center">
          <span className="font-display text-2xl text-[var(--deep-wine)]/30 px-8 text-center">
            {product.name}
          </span>
        </div>

        <div>
          {product.is_bestseller && (
            <span className="inline-block text-xs uppercase tracking-wider text-[var(--warm-gold)] font-medium mb-2">
              Best Seller
            </span>
          )}
          <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-2">
            {product.name}
          </h1>
          {product.tagline && (
            <p className="text-[var(--muted)] mb-4">{product.tagline}</p>
          )}

          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-medium text-[var(--deep-wine)]">
              &#8377;{product.price_inr}
            </span>
            {onSale && (
              <span className="text-base text-[var(--ink)]/40 line-through">
                &#8377;{product.compare_at_price_inr}
              </span>
            )}
          </div>

          <p className="text-sm text-[var(--ink)]/85 mb-6 leading-relaxed">
            {product.description}
          </p>

          <AddToCartForm product={product} />

          <div className="grid grid-cols-2 gap-3 mt-6 text-xs text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--moss)]" />
              {product.stock_quantity > 0 ? "In stock, ready to ship" : "Out of stock"}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--moss)]" />
              Delivered in 3–5 business days
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--moss)]" />
              Secure checkout via Razorpay
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--moss)]" />
              Dermatologist tested
            </div>
          </div>
        </div>
      </div>

      {/* Benefits + ingredients */}
      <div className="grid md:grid-cols-2 gap-16 mb-20">
        <div>
          <h2 className="font-display text-2xl text-[var(--deep-wine)] mb-5">Key benefits</h2>
          <ul className="space-y-3">
            {product.key_benefits.map((b) => (
              <li key={b} className="flex gap-3 text-sm text-[var(--ink)]/85">
                <span className="text-[var(--warm-gold)] mt-0.5">&#10003;</span>
                {b}
              </li>
            ))}
          </ul>

          <h2 className="font-display text-2xl text-[var(--deep-wine)] mt-10 mb-2">
            {product.category === "haircare" ? "Suitable for" : "Skin type"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {product.skin_hair_type.map((t) => (
              <span
                key={t}
                className="text-xs px-3 py-1.5 rounded-full bg-[var(--milk-sage)] text-[var(--deep-wine)]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl text-[var(--deep-wine)] mb-5">Key ingredients</h2>
          <div className="space-y-4">
            {product.key_ingredients.map((ing) => (
              <div key={ing.name}>
                <div className="text-sm font-medium text-[var(--deep-wine)]">{ing.name}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{ing.explanation}</div>
              </div>
            ))}
          </div>

          {product.full_ingredient_list && (
            <details className="mt-6 text-xs text-[var(--muted)]">
              <summary className="cursor-pointer text-[var(--deep-wine)] font-medium">
                Full ingredient list
              </summary>
              <p className="mt-2 leading-relaxed">{product.full_ingredient_list}</p>
            </details>
          )}
        </div>
      </div>

      {/* How to use */}
      {product.how_to_use && (
        <div className="mb-20 bg-[var(--milk-sage)] border border-[var(--line)] rounded-3xl p-8 md:p-10">
          <h2 className="font-display text-2xl text-[var(--deep-wine)] mb-3">How to use</h2>
          <p className="text-sm text-[var(--ink)]/85 leading-relaxed max-w-2xl">
            {product.how_to_use}
          </p>
        </div>
      )}

      {/* Reviews */}
      <div className="mb-20">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl text-[var(--deep-wine)]">Customer reviews</h2>
          <span className="text-xs text-[var(--ink)]/50">
            * Live reviews pull from the `reviews` table once connected
          </span>
        </div>
        <div className="bg-[var(--milk-sage)] border border-[var(--line)] rounded-2xl p-8 text-center text-sm text-[var(--muted)]">
          No reviews yet for this product — be the first to leave one after your order arrives.
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-20 max-w-3xl">
        <h2 className="font-display text-2xl text-[var(--deep-wine)] mb-6">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {genericFaqs.map((f) => (
            <details key={f.q} className="bg-[var(--milk-sage)] border border-[var(--line)] rounded-xl p-5">
              <summary className="cursor-pointer text-sm font-medium text-[var(--deep-wine)]">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Complete your routine */}
      {routinePartner && (
        <div className="mb-20 bg-[var(--milk-sage)] border border-[var(--line)] rounded-3xl p-8 md:p-10">
          <h2 className="font-display text-2xl text-[var(--deep-wine)] mb-6">
            Complete your {product.subrange} routine
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-sm font-medium text-[var(--ink)]">{product.name}</div>
            <span className="text-[var(--muted)] text-lg">+</span>
            <div className="text-sm font-medium text-[var(--ink)]">{routinePartner.name}</div>
            <CompleteRoutineButton products={[product, routinePartner]} label="Add Both to Cart" />
          </div>
        </div>
      )}

      {/* Related products */}
      {related.length > 0 && (
        <div>
          <h2 className="font-display text-2xl text-[var(--deep-wine)] mb-6">
            You may also like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
