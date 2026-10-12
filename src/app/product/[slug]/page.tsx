import { notFound } from "next/navigation";
import { getProduct, getAllProducts } from "@/lib/catalog";
import { getProducts as getLocalProducts } from "@/lib/products";
import AddToCartForm from "@/components/AddToCartForm";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import CustomerReviews from "@/components/CustomerReviews";
import RoutineUpsell from "@/components/RoutineUpsell";

export async function generateStaticParams() { return getLocalProducts().map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return { title: `${product.name} | Humor Luxury`, description: product.tagline ?? product.description.slice(0, 155) };
}

const genericFaqs = [
  { q: "Is this suitable for sensitive skin?", a: "Our formulas avoid parabens and sulphates, but we always recommend a patch test 24 hours before first full use, especially if you have known sensitivities." },
  { q: "How long until I see results?", a: "Most customers notice a difference within 2–4 weeks of consistent use. Skincare works cumulatively, so daily use matters more than any single application." },
  { q: "What's your return policy?", a: "Unopened products can be returned within 7 days of delivery. Opened products are covered under our satisfaction guarantee — reach out to our support team." },
];

const sunscreenImages = [
  { src: "/products/sunscreen-main.webp", alt: "Humor Luxury Sunscreen SPF 50+" },
  { src: "/products/sunscreen-model-1.webp", alt: "Humor Luxury Sunscreen model" },
  { src: "/products/sunscreen-uva-uvb.webp", alt: "Humor Luxury Sunscreen UVA and UVB protection" },
  { src: "/products/sunscreen-lifestyle.webp", alt: "Humor Luxury Sunscreen lifestyle" },
  { src: "/products/sunscreen-benefits.webp", alt: "Humor Luxury Sunscreen benefits" },
];


const productVolumes: Record<string, string> = {
  "HL-SKC-FMW-100": "100 ml",
  "HL-SKC-FMS-30": "30 ml",
  "HL-SKC-BBW-100": "100 ml",
  "HL-SKC-BBS-30": "30 ml",
  "HL-SKC-VTW-100": "100 ml",
  "HL-SKC-VTS-30": "30 ml",
  "HL-SKC-SUN-50": "50 ml",
  "HL-HRC-SHM-250": "250 ml",
  "HL-HRC-CND-250": "250 ml",
  "HL-HRC-MSK-200": "200 ml",
  "HL-HRC-SHM-SS-500": "500 ml",
  "HL-BDC-SHG-300": "300 ml",
};

function getProductHighlights(product: { sku: string; category: string; name: string; slug?: string }) {
  if (product.slug === "smooth-shake-daily-shampoo") return [
    { label: "Cleanses Gently", symbol: "droplet" },
    { label: "Smooth & Glossy Hair", symbol: "waves" },
    { label: "Strengthens Hair Fiber", symbol: "hair" },
    { label: "Deep Hydration", symbol: "drop" },
  ];
  if (product.sku === "HL-SKC-SUN-50") return [
    { label: "Broad Spectrum", symbol: "☀" },
    { label: "Daily Protection", symbol: "✓" },
    { label: "Lightweight Feel", symbol: "◉" },
    { label: "UVA + UVB Care", symbol: "✧" },
  ];
  if (product.category === "haircare" && product.sku.includes("SHM-SS")) return [
    { label: "Cleanses Gently", symbol: "◉" },
    { label: "Smooth & Glossy Hair", symbol: "≋" },
    { label: "Strengthens Hair Fiber", symbol: "♧" },
    { label: "Deep Hydration", symbol: "✧" },
  ];
  if (product.category === "haircare" && product.sku.includes("CND")) return [
    { label: "Smooth & Detangle", symbol: "≋" },
    { label: "Silky Shine", symbol: "✧" },
    { label: "Soft-Feeling Hair", symbol: "♧" },
    { label: "Everyday Hair Care", symbol: "♡" },
  ];
  if (product.category === "haircare") return [
    { label: "Deep Conditioning", symbol: "◉" },
    { label: "Smooth Hair", symbol: "≋" },
    { label: "Soft & Bouncy", symbol: "✧" },
    { label: "Hair Fiber Care", symbol: "♧" },
  ];
  if (product.category === "bodycare") return [
    { label: "Gentle Cleansing", symbol: "◉" },
    { label: "Moisture Care", symbol: "≋" },
    { label: "Soft-Feeling Skin", symbol: "♡" },
    { label: "Everyday Care", symbol: "♧" },
  ];
  if (product.name.toLowerCase().includes("serum")) return [
    { label: "Targeted Care", symbol: "✧" },
    { label: "Smoother Texture", symbol: "≋" },
    { label: "Hydration Support", symbol: "◉" },
    { label: "Skin Barrier Care", symbol: "✓" },
  ];
  return [
    { label: "Gentle Cleansing", symbol: "◉" },
    { label: "Fresh-Feeling Skin", symbol: "✧" },
    { label: "Skin Comfort", symbol: "♡" },
    { label: "Everyday Care", symbol: "♧" },
  ];
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-star" aria-label={rating > 0 ? `${rating} out of 5 stars` : "No reviews yet"}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-lg leading-none ${rating > 0 && i <= Math.round(rating) ? "text-[var(--warm-gold)]" : "text-[var(--ink)]/20"}`}>★</span>
      ))}
    </div>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return notFound();
  const allProducts = await getAllProducts();
  const related = allProducts.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  const onSale = product.compare_at_price_inr && product.compare_at_price_inr > product.price_inr;
  const gallery = slug === "sunscreen-spf-50" ? sunscreenImages : product.images.map((src) => ({ src, alt: product.name }));
  const serumSlugs = ["fullmoon-face-serum", "blemish-block-face-serum", "velvet-touch-face-serum"];
  if (serumSlugs.includes(slug)) gallery.push({ src: "/products/serum-application-steps.svg", alt: "Four steps for applying skincare serum" });
  const volume = productVolumes[product.sku];
  const highlights = getProductHighlights({ ...product, slug });

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-14">
      <nav className="text-xs text-[var(--ink)]/50 mb-8 flex gap-2"><a href="/" className="hover:underline">Home</a><span>/</span><a href="/shop" className="hover:underline">Shop</a><span>/</span><span className="text-[var(--deep-wine)]">{product.name}</span></nav>
      <div className="grid md:grid-cols-2 gap-12 mb-20">
        <ProductGallery images={gallery} />
        <div>
          {product.is_bestseller && <span className="inline-block text-xs uppercase tracking-wider text-[var(--warm-gold)] font-medium mb-2">Best Seller</span>}
          <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-2">{product.name}</h1>
          {product.tagline && <p className="text-[var(--muted)] mb-3">{product.tagline}</p>}
          <div className="flex items-center gap-2 mb-4">
            <RatingStars rating={product.rating} />
            {product.rating > 0 ? (
              <span className="text-sm text-[var(--muted)]">{product.rating.toFixed(2)}{product.review_count > 0 ? ` · ${product.review_count} customer review${product.review_count === 1 ? "" : "s"}` : " · Rated by customers"}</span>
            ) : (
              <span className="text-sm text-[var(--muted)]">No reviews yet</span>
            )}
          </div>
          <div className="flex items-center gap-3 mb-5"><span className="text-2xl md:text-3xl font-semibold text-[var(--deep-wine)]">&#8377;{product.price_inr}</span>{onSale && <span className="text-base text-[var(--ink)]/40 line-through">&#8377;{product.compare_at_price_inr}</span>}{onSale && <span className="rounded-full bg-pink-100 text-pink-700 px-3 py-1 text-xs font-semibold">{Math.round((1 - product.price_inr / product.compare_at_price_inr!) * 100)}% OFF</span>}<span className="ml-auto whitespace-nowrap text-sm md:text-base text-[var(--ink)]/75">{volume || ""}</span></div>
          <div className="grid grid-cols-4 gap-2 md:gap-3 mb-5" aria-label="Product standards">
            {[
              { label: "Paraben Free", icon: <><path d="M12 3h8v5l3 4v8a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2v-8l3-4z" /><path d="M12 8h8M13 15h6" /></> },
              { label: "Sulphate Free", icon: <><path d="M12 3C9 8 5 11 5 16a7 7 0 0 0 14 0c0-5-4-8-7-13z" /><path d="m4 4 16 16" /></> },
              { label: "Cruelty Free", icon: <><path d="M12 20s-8-4.5-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6.5-8 11-8 11z" /><path d="m4 4 16 16" /></> },
              { label: "Dermatologically Tested", icon: <><path d="M12 3 20 6v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /><path d="m8 12 2.5 2.5L16 9" /></> },
            ].map(({ label, icon }) => (
              <div key={label} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                <div className="flex h-11 w-11 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--milk-sage)] text-[var(--deep-wine)] [&>svg]:block [&>svg]:shrink-0">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                </div>
                <span className="text-[9px] md:text-[11px] leading-tight font-medium text-[var(--ink)]">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-[var(--ink)]/85 mb-6 leading-relaxed">{product.description}</p>
          <RoutineUpsell product={product} products={allProducts} />
          <AddToCartForm product={product} />
          <div className="grid grid-cols-2 gap-3 mt-6 text-xs text-[var(--muted)]">
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--moss)]" />{product.stock_quantity > 0 ? "In stock, ready to ship" : "Out of stock"}</div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--moss)]" />Delivered in 3–5 business days</div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--moss)]" />Secure checkout via Razorpay</div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--moss)]" />Dermatologically tested</div>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-16 mb-20">
        <div><h2 className="font-display text-2xl text-[var(--deep-wine)] mb-5">Key benefits</h2><ul className="space-y-3">{product.key_benefits.map((b) => <li key={b} className="flex gap-3 text-sm text-[var(--ink)]/85"><span className="text-[var(--warm-gold)] mt-0.5">&#10003;</span>{b}</li>)}</ul><h2 className="font-display text-2xl text-[var(--deep-wine)] mt-10 mb-2">{product.category === "haircare" ? "Suitable for" : "Skin type"}</h2><div className="flex flex-wrap gap-2">{product.skin_hair_type.map((t) => <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-[var(--milk-sage)] text-[var(--deep-wine)]">{t}</span>)}</div></div>
        <div><h2 className="font-display text-2xl text-[var(--deep-wine)] mb-5">Key ingredients</h2><div className="space-y-4">{product.key_ingredients.map((ing) => <div key={ing.name}><div className="text-sm font-medium text-[var(--deep-wine)]">{ing.name}</div><div className="text-xs text-[var(--muted)] mt-0.5">{ing.explanation}</div></div>)}</div></div>
      </div>
      {product.how_to_use && <div className="mb-20 bg-[var(--milk-sage)] border border-[var(--line)] rounded-3xl p-8 md:p-10"><h2 className="font-display text-2xl text-[var(--deep-wine)] mb-3">How to use</h2><p className="text-sm text-[var(--ink)]/85 leading-relaxed max-w-2xl">{product.how_to_use}</p></div>}
      <CustomerReviews product={product} />
      <div className="mb-20 max-w-3xl"><h2 className="font-display text-2xl text-[var(--deep-wine)] mb-6">Frequently asked questions</h2><div className="space-y-3">{genericFaqs.map((f) => <details key={f.q} className="bg-[var(--milk-sage)] border border-[var(--line)] rounded-xl p-5"><summary className="cursor-pointer text-sm font-medium text-[var(--deep-wine)]">{f.q}</summary><p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{f.a}</p></details>)}</div></div>
      {related.length > 0 && <div><h2 className="font-display text-2xl text-[var(--deep-wine)] mb-6">You may also like</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-6">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div></div>}
    </div>
  );
}
