import { Product } from "@/types/product";

// Local fixture data — used automatically whenever Shopify isn't configured
// (see lib/catalog.ts). Shaped as closely as possible to what the Shopify
// adapter returns, so switching over is a data-source change, not a UI change.
// shopify_variant_id is null here because these aren't real Shopify variants —
// once Shopify is connected, cart/checkout automatically uses live variant IDs.

const base = {
  shopify_variant_id: null,
  images: [],
  before_after_images: [],
  status: "live" as const,
};

export const products: Product[] = [
  // ---- Fullmoon (dry/dull skin) ----
  {
    ...base,
    id: "1",
    slug: "fullmoon-face-wash",
    name: "Fullmoon Face Wash",
    tagline: "Gentle cleanser for dry, dull skin",
    description:
      "A cream-based cleanser that removes impurities without stripping the skin, formulated for dry and dull complexions that need cleansing without tightness afterward.",
    key_benefits: ["Cleanses without stripping natural moisture", "Softens rough, dull texture", "Leaves skin comfortable, never tight"],
    key_ingredients: [
      { name: "Glycerin", explanation: "Draws moisture into the skin during cleansing." },
      { name: "Oat Extract", explanation: "Soothes and calms while cleansing." },
    ],
    full_ingredient_list: "Aqua, Glycerin, Cocamidopropyl Betaine, Avena Sativa (Oat) Kernel Extract, Panthenol, Citric Acid, Phenoxyethanol.",
    skin_hair_type: ["Dry Skin", "Dull Skin"],
    how_to_use: "Massage onto damp skin morning and night, rinse thoroughly.",
    category: "skincare",
    subrange: "Fullmoon",
    concern_tags: ["Dry Skin"],
    routine_tags: ["Morning", "Night"],
    price_inr: 199,
    compare_at_price_inr: 349,
    stock_quantity: 40,
    sku: "HL-SKC-FMW-100",
    is_bestseller: false,
    is_featured: true,
    is_new: false,
    rating: 4.5,
    review_count: 214,
  },
  {
    ...base,
    id: "2",
    slug: "fullmoon-face-serum",
    name: "Fullmoon Face Serum",
    tagline: "Overnight recovery serum for dry, dull skin",
    description:
      "A deeply nourishing serum built to lock in moisture and support the skin barrier, for skin that wakes up feeling replenished rather than tight.",
    key_benefits: ["Restores moisture lost through the day", "Supports a stronger-feeling skin barrier", "Softer, more comfortable skin by morning"],
    key_ingredients: [
      { name: "Ceramide Complex", explanation: "Helps rebuild the skin's natural moisture barrier." },
      { name: "Squalane", explanation: "A lightweight oil that mimics skin's own lipids." },
    ],
    full_ingredient_list: "Aqua, Squalane, Glycerin, Ceramide NP, Panthenol, Phenoxyethanol, Tocopherol.",
    skin_hair_type: ["Dry Skin", "Sensitive Skin"],
    how_to_use: "Apply a few drops to face and neck as the last step of your night routine.",
    category: "skincare",
    subrange: "Fullmoon",
    concern_tags: ["Dry Skin"],
    routine_tags: ["Night"],
    price_inr: 325,
    compare_at_price_inr: 599,
    stock_quantity: 30,
    sku: "HL-SKC-FMS-30",
    is_bestseller: false,
    is_featured: true,
    is_new: false,
    rating: 4.7,
    review_count: 528,
  },
  // ---- Blemish Block (acne) ----
  {
    ...base,
    id: "3",
    slug: "blemish-block-face-wash",
    name: "Blemish Block Face Wash",
    tagline: "Oil-control cleanser for acne-prone skin",
    description:
      "A gel cleanser with salicylic acid and niacinamide that clears congestion and controls shine without over-drying acne-prone skin.",
    key_benefits: ["Reduces the look of breakouts", "Controls excess oil through the day", "Non-drying, safe for daily use"],
    key_ingredients: [
      { name: "Salicylic Acid (0.5%)", explanation: "Gently clears congestion within pores." },
      { name: "Niacinamide", explanation: "Regulates oil and calms the look of irritation." },
    ],
    full_ingredient_list: "Aqua, Salicylic Acid, Niacinamide, Cocamidopropyl Betaine, Glycerin, Phenoxyethanol.",
    skin_hair_type: ["Oily Skin", "Acne-Prone"],
    how_to_use: "Massage onto damp skin morning and night, rinse thoroughly.",
    category: "skincare",
    subrange: "Blemish Block",
    concern_tags: ["Acne", "Oily Skin"],
    routine_tags: ["Morning", "Night"],
    price_inr: 199,
    compare_at_price_inr: 349,
    stock_quantity: 55,
    sku: "HL-SKC-BBW-100",
    is_bestseller: true,
    is_featured: true,
    is_new: false,
    rating: 4.4,
    review_count: 356,
  },
  {
    ...base,
    id: "4",
    slug: "blemish-block-face-serum",
    name: "Blemish Block Face Serum",
    tagline: "Niacinamide gel-serum for acne-prone skin",
    description:
      "A featherweight gel-serum that pairs niacinamide with zinc PCA to calm the look of breakouts and manage excess shine, without the tight, over-dried feeling many acne products leave behind.",
    key_benefits: ["Reduces the appearance of shine through the day", "Calms the look of active breakouts and redness", "Non-comedogenic — won't clog pores"],
    key_ingredients: [
      { name: "Niacinamide 5%", explanation: "Regulates oil production and visibly refines the look of pores." },
      { name: "Zinc PCA", explanation: "Helps control shine and supports a calmer-looking complexion." },
    ],
    full_ingredient_list: "Aqua, Niacinamide, Zinc PCA, Salicylic Acid, Glycerin, Propanediol, Carbomer, Phenoxyethanol.",
    skin_hair_type: ["Oily Skin", "Acne-Prone", "Combination"],
    how_to_use: "Apply a thin layer to clean skin, morning and night, before moisturiser.",
    category: "skincare",
    subrange: "Blemish Block",
    concern_tags: ["Acne", "Oily Skin"],
    routine_tags: ["Morning", "Night"],
    price_inr: 325,
    compare_at_price_inr: 599,
    stock_quantity: 58,
    sku: "HL-SKC-BBS-30",
    is_bestseller: true,
    is_featured: true,
    is_new: false,
    rating: 4.8,
    review_count: 812,
  },
  // ---- Velvet Touch (everyday skincare) ----
  {
    ...base,
    id: "5",
    slug: "velvet-touch-face-wash",
    name: "Velvet Touch Face Wash",
    tagline: "Everyday gentle cleanser, all skin types",
    description:
      "A mild, low-lather daily cleanser suited to any skin type — the reliable first step for anyone building a simple, everyday routine.",
    key_benefits: ["Cleanses gently without disrupting the skin barrier", "Suitable for daily, twice-a-day use", "Fragrance-light formula"],
    key_ingredients: [
      { name: "Glycerin", explanation: "Keeps the cleanse from feeling stripping." },
      { name: "Panthenol", explanation: "Supports visible skin comfort." },
    ],
    full_ingredient_list: "Aqua, Glycerin, Cocamidopropyl Betaine, Panthenol, Citric Acid, Phenoxyethanol.",
    skin_hair_type: ["All Skin Types"],
    how_to_use: "Massage onto damp skin morning and night, rinse thoroughly.",
    category: "skincare",
    subrange: "Velvet Touch",
    concern_tags: [],
    routine_tags: ["Morning", "Night"],
    price_inr: 199,
    compare_at_price_inr: 349,
    stock_quantity: 60,
    sku: "HL-SKC-VTW-100",
    is_bestseller: false,
    is_featured: false,
    is_new: false,
    rating: 4.5,
    review_count: 189,
  },
  {
    ...base,
    id: "6",
    slug: "velvet-touch-face-serum",
    name: "Velvet Touch Face Serum",
    tagline: "Brightening vitamin C serum for everyday tone",
    description:
      "A lightweight, fast-absorbing serum built around stabilised Vitamin C to visibly brighten skin and soften the look of dark spots over time.",
    key_benefits: ["Visibly brightens dull, uneven skin tone", "Softens the look of dark spots and pigmentation", "Lightweight — layers well under moisturiser"],
    key_ingredients: [
      { name: "Vitamin C (Sodium Ascorbyl Phosphate)", explanation: "A stable form of Vitamin C that brightens without irritation." },
      { name: "Hyaluronic Acid", explanation: "Draws in moisture so the serum feels hydrating, not stripping." },
    ],
    full_ingredient_list: "Aqua, Sodium Ascorbyl Phosphate, Niacinamide, Glycerin, Sodium Hyaluronate, Phenoxyethanol, Tocopherol.",
    skin_hair_type: ["All Skin Types", "Uneven Tone"],
    how_to_use: "Apply 3–4 drops every morning before moisturiser and SPF.",
    category: "skincare",
    subrange: "Velvet Touch",
    concern_tags: ["Pigmentation"],
    routine_tags: ["Morning"],
    price_inr: 325,
    compare_at_price_inr: 599,
    stock_quantity: 42,
    sku: "HL-SKC-VTS-30",
    is_bestseller: true,
    is_featured: true,
    is_new: false,
    rating: 4.6,
    review_count: 812,
  },
  // ---- Sun Care ----
  {
    ...base,
    id: "7",
    slug: "sunscreen-spf-50",
    name: "Sunscreen SPF 50 PA++++",
    tagline: "Lightweight daily sun protection",
    description:
      "A broad-spectrum SPF 50 sunscreen with a no-white-cast finish, light enough to wear every day under makeup.",
    key_benefits: ["Broad-spectrum UVA/UVB protection", "No white cast, blends into all skin tones", "Non-greasy, matte-leaning finish"],
    key_ingredients: [{ name: "Broad-spectrum UV filters", explanation: "Protects against UVA and UVB exposure." }],
    full_ingredient_list: "Aqua, Homosalate, Octocrylene, Avobenzone, Niacinamide, Dimethicone, Phenoxyethanol.",
    skin_hair_type: ["All Skin Types"],
    how_to_use: "Apply generously as the last step of your morning routine. Reapply every 3–4 hours in direct sun.",
    category: "skincare",
    subrange: null,
    concern_tags: ["Sun Protection"],
    routine_tags: ["Morning"],
    price_inr: 299,
    compare_at_price_inr: 549,
    stock_quantity: 70,
    sku: "HL-SKC-SUN-50",
    is_bestseller: true,
    is_featured: true,
    is_new: true,
    rating: 4.7,
    review_count: 342,
  },
  // ---- Hair Care ----
  {
    ...base,
    id: "8",
    slug: "repair-shampoo",
    name: "Repair Shampoo",
    tagline: "Sulphate-free shampoo for damaged, frizzy hair",
    description:
      "A sulphate-free, protein-enriched shampoo that cleanses without stripping. Built for hair that's colour-treated, heat-styled, or just needs a little extra softness back.",
    key_benefits: ["Cleanses gently without stripping natural oils", "Reduces the look of frizz and flyaways", "Safe for colour-treated hair"],
    key_ingredients: [
      { name: "Hydrolysed Milk Protein", explanation: "Helps strengthen and smooth the hair shaft." },
      { name: "Argan Oil", explanation: "Adds shine and softness without weighing hair down." },
    ],
    full_ingredient_list: "Aqua, Sodium Cocoyl Isethionate, Cocamidopropyl Betaine, Hydrolysed Milk Protein, Argania Spinosa Oil, Glycerin, Phenoxyethanol.",
    skin_hair_type: ["Dry Hair", "Frizzy Hair", "Colour-Treated Hair"],
    how_to_use: "Apply to wet hair, massage into scalp and lengths, rinse. Follow with conditioner.",
    category: "haircare",
    subrange: null,
    concern_tags: ["Hair Care"],
    routine_tags: ["Hair Care Routine"],
    price_inr: 375,
    compare_at_price_inr: 699,
    stock_quantity: 65,
    sku: "HL-HRC-SHM-250",
    is_bestseller: true,
    is_featured: true,
    is_new: false,
    rating: 4.5,
    review_count: 291,
  },
  {
    ...base,
    id: "9",
    slug: "repair-conditioner",
    name: "Repair Conditioner",
    tagline: "Detangling conditioner for damaged, frizzy hair",
    description:
      "A rich conditioner that detangles and smooths without weighing hair down — the second half of the Repair duo.",
    key_benefits: ["Detangles without heaviness", "Smooths flyaways and frizz", "Softer, more manageable hair"],
    key_ingredients: [
      { name: "Hydrolysed Milk Protein", explanation: "Continues the strengthening effect from the shampoo." },
      { name: "Shea Butter", explanation: "Softens and smooths the hair surface." },
    ],
    full_ingredient_list: "Aqua, Cetearyl Alcohol, Behentrimonium Chloride, Hydrolysed Milk Protein, Butyrospermum Parkii (Shea) Butter, Phenoxyethanol.",
    skin_hair_type: ["Dry Hair", "Frizzy Hair"],
    how_to_use: "Apply from mid-length to ends after shampooing, leave 2–3 minutes, rinse.",
    category: "haircare",
    subrange: null,
    concern_tags: ["Hair Care"],
    routine_tags: ["Hair Care Routine"],
    price_inr: 249,
    compare_at_price_inr: 449,
    stock_quantity: 50,
    sku: "HL-HRC-CND-250",
    is_bestseller: false,
    is_featured: false,
    is_new: false,
    rating: 4.4,
    review_count: 133,
  },
  {
    ...base,
    id: "10",
    slug: "repair-hair-mask",
    name: "Repair Hair Mask",
    tagline: "Weekly deep-repair treatment mask",
    description:
      "An intensive weekly treatment for chemically-treated or heat-damaged hair — a deeper dose of the same repair actives as the shampoo and conditioner.",
    key_benefits: ["Deep conditioning for very dry or damaged hair", "Reduces breakage over consistent use", "Leaves hair visibly smoother"],
    key_ingredients: [
      { name: "Hydrolysed Milk Protein", explanation: "Concentrated strengthening treatment." },
      { name: "Argan Oil", explanation: "Deep nourishment for very dry lengths and ends." },
    ],
    full_ingredient_list: "Aqua, Cetearyl Alcohol, Hydrolysed Milk Protein, Argania Spinosa Oil, Shea Butter, Phenoxyethanol.",
    skin_hair_type: ["Damaged Hair", "Chemically Treated"],
    how_to_use: "Apply generously after shampooing, leave 10–15 minutes, rinse thoroughly. Use 1–2 times weekly.",
    category: "haircare",
    subrange: null,
    concern_tags: ["Hair Care"],
    routine_tags: ["Hair Care Routine"],
    price_inr: 475,
    compare_at_price_inr: 899,
    stock_quantity: 35,
    sku: "HL-HRC-MSK-200",
    is_bestseller: false,
    is_featured: false,
    is_new: true,
    rating: 4.6,
    review_count: 87,
  },
  // ---- Body Care ----
  {
    ...base,
    id: "11",
    slug: "shower-gel",
    name: "Shower Gel",
    tagline: "Everyday gentle body wash",
    description:
      "A gentle, sulphate-free body wash that cleanses without drying out skin, for daily use across the whole body.",
    key_benefits: ["Cleanses without over-drying", "Light, non-lingering fragrance", "Suitable for daily use"],
    key_ingredients: [{ name: "Glycerin", explanation: "Keeps the cleanse comfortable, not stripping." }],
    full_ingredient_list: "Aqua, Sodium Cocoyl Isethionate, Glycerin, Cocamidopropyl Betaine, Citric Acid, Phenoxyethanol, Parfum.",
    skin_hair_type: ["All Skin Types"],
    how_to_use: "Massage onto wet skin, lather, rinse thoroughly.",
    category: "bodycare",
    subrange: null,
    concern_tags: [],
    routine_tags: [],
    price_inr: 225,
    compare_at_price_inr: 399,
    stock_quantity: 80,
    sku: "HL-BDC-SHG-300",
    is_bestseller: false,
    is_featured: false,
    is_new: false,
    rating: 4.3,
    review_count: 96,
  },
];

export function getProducts() {
  return products.filter((p) => p.status === "live");
}

export function getFeaturedProducts() {
  return products.filter((p) => p.is_featured && p.status === "live");
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug && p.status === "live");
}

export function getProductsByConcern(concern: string) {
  return products.filter((p) => p.concern_tags.includes(concern) && p.status === "live");
}

export function getProductsBySubrange(subrange: string) {
  return products.filter((p) => p.subrange === subrange && p.status === "live");
}

export function getProductsByCategory(category: Product["category"]) {
  return products.filter((p) => p.category === category && p.status === "live");
}
