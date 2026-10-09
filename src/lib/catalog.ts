import { Product } from "@/types/product";
import { isShopifyConfigured } from "./shopify/client";
import {
  fetchShopifyProducts,
  fetchShopifyProductByHandle,
  fetchShopifyCollectionProducts,
} from "./shopify/adapter";
import { supabaseAdmin } from "./supabase";
import * as local from "./products";

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const finalProductNames: Record<string, string> = {
  "sunscreen-spf-50": "Light & Shade Sunscreen SPF 50",
  "repair-shampoo": "Protein Shake Anti Hairfall Shampoo",
  "repair-conditioner": "Silk Shake Smooth Shine Conditioner",
  "repair-hair-mask": "Milk Shake Repairing Smooth Hair Mask",
  "shower-gel": "Royal Water Soft Shower Cream",
};

const mainImageOverrides: Record<string, string> = {
  "blemish-block-face-wash": "/products/blemish-block-face-wash-main.webp",
  "velvet-touch-face-wash": "/products/velvet-touch-face-wash-main.webp",
  "fullmoon-face-wash": "/products/fullmoon-face-wash-main.webp",
  "blemish-block-face-serum": "/products/blemish-block-face-serum-main.webp",
  "velvet-touch-face-serum": "/products/velvet-touch-face-serum-main.webp",
  "fullmoon-face-serum": "/products/fullmoon-face-serum-main.webp",
  "repair-shampoo": "/products/protein-shake-shampoo-main.webp",
  "repair-conditioner": "/products/conditioner-main.webp",
  "repair-hair-mask": "/products/milk-shake-hair-mask-main.webp",
  "sunscreen-spf-50": "/products/sunscreen-main.webp",
  "shower-gel": "/products/shower-gel-main.webp",
};

const productContentOverrides: Record<string, Partial<Product>> = {
  "repair-conditioner": {
    tagline: "Silky-smooth shine and easy detangling for everyday hair care",
    description: "A smoothing conditioner formulated with Keratin, Sodium Hyaluronate, Glycerin, Bee Pollen and Betaine. It helps detangle lengths, soften rough-feeling strands and tame the look of frizz, leaving hair smoother, shinier and easier to manage without a heavy finish.",
    key_benefits: [
      "Helps detangle hair and improve manageability",
      "Leaves hair feeling soft and looking silky-smooth",
      "Helps tame frizz and enhance the appearance of shine",
    ],
    key_ingredients: [
      { name: "Keratin", explanation: "Helps smooth the feel of damaged, rough hair and improve manageability." },
      { name: "Sodium Hyaluronate", explanation: "Helps attract and retain moisture for softer-feeling hair." },
      { name: "Glycerin", explanation: "Helps draw in moisture and reduce the feel of dryness." },
      { name: "Bee Pollen", explanation: "Provides conditioning support for a nourished-feeling finish." },
      { name: "Betaine", explanation: "Helps condition hair and improve softness and combability." },
    ],
    full_ingredient_list: "Keratin, Sodium Hyaluronate, Glycerin, Bee Pollen, Betaine.",
    skin_hair_type: ["Dry Hair", "Frizzy Hair", "Tangled Hair"],
    concern_tags: ["Smoothing", "Shine", "Detangling", "Frizz Control"],
  },
  "repair-hair-mask": {
    tagline: "Premium deep-conditioning mask for silky, smooth, bouncy hair",
    description: "A premium intensive hair mask formulated with Keratin, Sodium Hyaluronate, Glycerin, Bee Pollen and Betaine. Created for dry, dull or damage-prone lengths, this rich treatment helps deeply condition hair, improve the feel of roughness, reduce the appearance of frizz and leave strands silky-smooth, glossy and full of bounce.",
    key_benefits: [
      "Intensive conditioning for dry and damage-prone lengths",
      "Helps hair feel silky-smooth, soft and more elastic",
      "Helps control the appearance of frizz and improve shine",
      "Leaves hair feeling bouncy, nourished and easier to style",
    ],
    key_ingredients: [
      { name: "Keratin", explanation: "Helps smooth the feel of damaged hair and improve the look of strength and manageability." },
      { name: "Sodium Hyaluronate", explanation: "Helps attract and retain moisture so hair feels softer and less dry." },
      { name: "Glycerin", explanation: "Helps draw in moisture to support a supple, conditioned feel." },
      { name: "Bee Pollen", explanation: "Provides conditioning support as part of the mask's premium care blend." },
      { name: "Betaine", explanation: "Helps soften hair and improve slip for easier detangling." },
    ],
    full_ingredient_list: "Keratin, Sodium Hyaluronate, Glycerin, Bee Pollen, Betaine.",
    skin_hair_type: ["Dry Hair", "Damaged Hair", "Frizzy Hair", "Dull Hair"],
    concern_tags: ["Deep Conditioning", "Damage Care", "Smoothness", "Bounce", "Shine"],
  },
  "repair-shampoo": {
    tagline: "Anti-hair fall shampoo with plant and protein care",
    description: "A daily shampoo formulated with Aloe Vera, Oat, Corn, Algae, Silk Protein, Pea Protein and Soybean. Designed to cleanse the scalp and hair while helping reduce the appearance of hair fall due to breakage and leaving hair feeling softer and stronger.",
    key_benefits: [
      "Helps reduce hair fall caused by breakage",
      "Gently cleanses the scalp and hair",
      "Helps leave hair feeling smoother, softer and stronger",
    ],
    key_ingredients: [
      { name: "Aloe Vera", explanation: "Helps condition the scalp and maintain moisture." },
      { name: "Oat", explanation: "Helps soothe and condition the scalp and hair." },
      { name: "Corn", explanation: "Provides plant-derived conditioning support for hair." },
      { name: "Algae", explanation: "Helps condition hair and support a healthy-looking finish." },
      { name: "Silk Protein", explanation: "Helps smooth the hair surface and improve softness." },
      { name: "Pea Protein", explanation: "Helps strengthen the feel of hair and improve manageability." },
      { name: "Soybean", explanation: "Provides plant-derived protein and conditioning support." },
    ],
    full_ingredient_list: "Aloe Vera, Oat, Corn, Algae, Silk Protein, Pea Protein, Soybean.",
    skin_hair_type: ["Weak Hair", "Breakage-Prone Hair", "Dry Hair"],
    concern_tags: ["Hair Fall", "Hair Strength", "Hair Care"],
  },
  "velvet-touch-face-wash": {
    tagline: "Soft creamy-foam face wash for soft, smooth skin",
    description: "A soap-based face wash that creates a soft, creamy foam to cleanse daily impurities and excess oil. Formulated with Coconut Milk, Liquorice, Aloe Vera Extract, Niacinamide, Pro-Vitamin B5, Fatty Acids and Betaine to help soften and smooth the feel of skin while supporting a fresh, balanced-looking complexion.",
    key_benefits: [
      "Soft, creamy foam for an enjoyable cleansing experience",
      "Helps leave skin feeling soft, smooth and refreshed",
      "Helps remove excess oil while maintaining skin comfort",
    ],
    key_ingredients: [
      { name: "Coconut Milk", explanation: "Helps condition skin for a soft, nourished feel." },
      { name: "Liquorice", explanation: "Helps improve the appearance of uneven-looking skin tone." },
      { name: "Aloe Vera Extract", explanation: "Helps soothe and hydrate skin." },
      { name: "Niacinamide", explanation: "Helps support the skin barrier and balance the look of oiliness." },
      { name: "Pro-Vitamin B5", explanation: "Helps maintain moisture and skin comfort." },
      { name: "Fatty Acids", explanation: "Help condition skin and support a smooth-feeling finish." },
      { name: "Betaine", explanation: "Helps maintain hydration and comfort during cleansing." },
    ],
    full_ingredient_list: "Coconut Milk, Liquorice, Aloe Vera Extract, Niacinamide, Pro-Vitamin B5, Fatty Acids, Betaine.",
    skin_hair_type: ["All Skin Types", "Oily Skin"],
    concern_tags: ["Softening", "Smoothing", "Oil Control"],
  },
  "fullmoon-face-wash": {
    tagline: "Brightening face wash for dull, uneven-looking skin",
    description: "A brightening cleanser designed to wash away daily impurities and help improve the look of dull, uneven skin tone. Aloe Vera Extract helps keep the cleansing experience feeling soothing and comfortable.",
    key_benefits: [
      "Helps skin look brighter and fresher",
      "Helps improve the appearance of uneven skin tone",
      "Cleanses while supporting a comfortable skin feel",
    ],
    key_ingredients: [
      { name: "Seaweed", explanation: "Helps condition skin and support a fresh-looking complexion." },
      { name: "Glycolic Acid", explanation: "An exfoliating AHA that helps smooth the look of rough texture and dullness." },
      { name: "Aloe Vera Extract", explanation: "Helps soothe and hydrate the skin." },
      { name: "Niacinamide", explanation: "Helps improve the look of uneven tone and supports the skin barrier." },
    ],
    full_ingredient_list: "Seaweed, Glycolic Acid, Aloe Vera Extract, Niacinamide.",
    skin_hair_type: ["Dull Skin", "Uneven Skin Tone"],
    concern_tags: ["Brightening", "Uneven Skin Tone"],
  },
  "blemish-block-face-wash": {
    tagline: "Anti-acne face wash for blemish-prone skin",
    description: "A daily cleansing face wash formulated with Tea Tree, Piroctone, Seaweed and Betaine. Designed to cleanse away daily impurities and excess oil while helping keep blemish-prone skin feeling fresh and comfortable.",
    key_benefits: [
      "Cleanses away daily impurities and excess oil",
      "Helps keep blemish-prone skin feeling fresh",
      "Cleanses without leaving skin feeling overly dry",
    ],
    key_ingredients: [
      { name: "Tea Tree", explanation: "Helps care for blemish-prone skin and excess oil." },
      { name: "Piroctone", explanation: "Helps maintain a clean-feeling complexion." },
      { name: "Seaweed", explanation: "Helps condition skin and support a fresh-looking feel." },
      { name: "Betaine", explanation: "Helps maintain moisture and skin comfort during cleansing." },
    ],
    full_ingredient_list: "Tea Tree, Piroctone, Seaweed, Betaine.",
    skin_hair_type: ["Oily Skin", "Acne-Prone Skin"],
    concern_tags: ["Acne", "Blemishes", "Oil Control"],
  },
  "blemish-block-face-serum": {
    tagline: "Anti-acne serum for blemish-prone skin",
    description: "A targeted anti-acne serum formulated with 0.5% Salicylic Acid, 0.5% Succinic Acid, 5% Niacinamide and 2% Allantoin. Designed to help unclog pores, reduce the appearance of blemishes and excess oil, and support calmer-looking skin.",
    key_benefits: [
      "Helps reduce the appearance of acne and blemishes",
      "Helps manage excess oil and the look of congested pores",
      "Helps soothe skin and improve the appearance of post-blemish marks",
    ],
    key_ingredients: [
      { name: "Salicylic Acid 0.5%", explanation: "Helps exfoliate inside pores and reduce the look of congestion." },
      { name: "Succinic Acid 0.5%", explanation: "Helps support blemish-prone skin and improve the look of imperfections." },
      { name: "Niacinamide 5%", explanation: "Helps balance the appearance of oiliness and improve uneven-looking tone." },
      { name: "Allantoin 2%", explanation: "Helps soothe and condition skin for a more comfortable feel." },
    ],
    full_ingredient_list: "0.5% Salicylic Acid, 0.5% Succinic Acid, 5% Niacinamide, 2% Allantoin.",
    skin_hair_type: ["Oily Skin", "Acne-Prone Skin", "Combination Skin"],
    concern_tags: ["Acne", "Blemishes", "Oil Control"],
  },
  "velvet-touch-face-serum": {
    tagline: "AHA, BHA & PHA exfoliating serum for uneven tone",
    description: "An exfoliating AHA, BHA and PHA serum formulated with 2% Glycolic Acid, 5% Lactic Acid, 2% Citric Acid, 1% Salicylic Acid and Gluconolactone. Designed to help exfoliate dead surface skin cells, smooth rough texture and improve the appearance of uneven tone and pigmentation for a brighter-looking complexion.",
    key_benefits: [
      "Helps exfoliate dead surface skin cells",
      "Helps smooth rough texture and improve the look of uneven tone",
      "Helps reduce the appearance of pigmentation and dullness",
    ],
    key_ingredients: [
      { name: "Glycolic Acid 2% (AHA)", explanation: "Helps exfoliate the skin surface and smooth the look of rough texture." },
      { name: "Lactic Acid 5% (AHA)", explanation: "Helps exfoliate and support a smoother, brighter-looking complexion." },
      { name: "Citric Acid 2% (AHA)", explanation: "Helps exfoliate the surface and improve the look of dullness." },
      { name: "Salicylic Acid 1% (BHA)", explanation: "Helps clear pore buildup and smooth the look of congested skin." },
      { name: "Gluconolactone (PHA)", explanation: "A gentle exfoliating polyhydroxy acid that helps refine skin texture." },
    ],
    full_ingredient_list: "2% Glycolic Acid, 5% Lactic Acid, 2% Citric Acid, 1% Salicylic Acid, Gluconolactone.",
    skin_hair_type: ["Uneven Skin Tone", "Dull Skin", "Textured Skin"],
    concern_tags: ["Exfoliation", "Pigmentation", "Uneven Skin Tone", "AHA BHA PHA"],
  },
  "fullmoon-face-serum": {
    tagline: "Whitening and brightening serum for uneven-looking skin tone",
    description: "A targeted skin-brightening serum formulated with 1% Kojic Acid, 1% Hyaluronic Acid and 1% Pro-Vitamin B5. Designed to help reduce the appearance of dark spots and uneven tone while hydrating skin for a smoother, more radiant-looking complexion.",
    key_benefits: [
      "Helps improve the appearance of dark spots and uneven skin tone",
      "Supports a brighter, more even-looking complexion",
      "Hydrates skin and helps maintain a soft, comfortable feel",
    ],
    key_ingredients: [
      { name: "Kojic Acid 1%", explanation: "Helps reduce the appearance of dark spots and uneven pigmentation for a brighter-looking complexion." },
      { name: "Hyaluronic Acid 1%", explanation: "Helps attract and retain moisture so skin looks plump and hydrated." },
      { name: "Pro-Vitamin B5 1% (Panthenol)", explanation: "Helps soothe skin and support moisture retention." },
    ],
    full_ingredient_list: "1% Kojic Acid, 1% Hyaluronic Acid, 1% Pro-Vitamin B5.",
    skin_hair_type: ["Uneven Skin Tone", "Dull Skin"],
    concern_tags: ["Whitening", "Brightening", "Dark Spots"],
  },
};

const galleryImageOverrides: Record<string, string[]> = {
  "repair-shampoo": ["/products/protein-shake-shampoo-model-1.webp"],
  "repair-hair-mask": ["/products/milk-shake-hair-mask-model-1.webp"],
  "blemish-block-face-serum": ["/products/blemish-block-face-serum-model-1.webp"],
  "velvet-touch-face-serum": ["/products/velvet-touch-face-serum-model-1.webp"],
  "fullmoon-face-serum": ["/products/fullmoon-face-serum-model-1.webp"],
  "blemish-block-face-wash": ["/products/blemish-block-face-wash-model-1.webp"],
  "velvet-touch-face-wash": ["/products/velvet-touch-face-wash-model-1.webp"],
  "fullmoon-face-wash": ["/products/fullmoon-face-wash-model-1.webp"],
  "shower-gel": ["/products/shower-gel-model-1.webp"],
  "sunscreen-spf-50": ["/products/sunscreen-model-1.webp"],
  "repair-conditioner": ["/products/conditioner-model-1.webp"],
};

// Ratings confirmed from the existing Humor Luxury website homepage.
// Products not listed here are treated as unrated rather than inventing review data.
const legacyRatings: Record<string, { rating: number; review_count: number }> = {
  "protein-shake-shampoo": { rating: 5, review_count: 0 },
  "blemish-block-face-serum": { rating: 5, review_count: 0 },
  "sunscreen-spf-50": { rating: 5, review_count: 1 },
  "velvet-touch-face-wash": { rating: 4, review_count: 1 },
};

function withMainImage(product: Product): Product {
  const mainImage = mainImageOverrides[product.slug];
  const galleryImages = galleryImageOverrides[product.slug] ?? [];
  const legacyRating = legacyRatings[product.slug];

  const images = [
    ...(mainImage ? [mainImage] : []),
    ...galleryImages,
    ...product.images.filter(
      (image) => image !== mainImage && !galleryImages.includes(image)
    ),
  ];

  return {
    ...product,
    ...(productContentOverrides[product.slug] ?? {}),
    ...(finalProductNames[product.slug] ? { name: finalProductNames[product.slug] } : {}),
    ...(legacyRating ?? { rating: 0, review_count: 0 }),
    images,
  };
}

function fromDatabase(row: Record<string, unknown>): Product {
  const product: Product = {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    tagline: String(row.tagline ?? ""),
    description: String(row.description ?? ""),
    key_benefits: Array.isArray(row.key_benefits) ? row.key_benefits.map(String) : [],
    key_ingredients: Array.isArray(row.key_ingredients) ? row.key_ingredients as Product["key_ingredients"] : [],
    full_ingredient_list: String(row.full_ingredient_list ?? ""),
    skin_hair_type: Array.isArray(row.skin_hair_type) ? row.skin_hair_type.map(String) : [],
    how_to_use: String(row.how_to_use ?? ""),
    category: String(row.category) as Product["category"],
    subrange: null,
    concern_tags: Array.isArray(row.concern_tags) ? row.concern_tags.map(String) : [],
    routine_tags: Array.isArray(row.routine_tags) ? row.routine_tags.map(String) : [],
    price_inr: Number(row.price_inr),
    compare_at_price_inr: row.compare_at_price_inr == null ? null : Number(row.compare_at_price_inr),
    stock_quantity: Number(row.stock_quantity ?? 0),
    sku: String(row.sku),
    images: Array.isArray(row.images) ? row.images.map(String) : [],
    before_after_images: Array.isArray(row.before_after_images) ? row.before_after_images : [],
    is_bestseller: Boolean(row.is_bestseller),
    is_featured: Boolean(row.is_featured),
    is_new: false,
    rating: 0,
    review_count: 0,
    shopify_variant_id: null,
    status: String(row.status) as Product["status"],
  };

  return withMainImage(product);
}

async function getDatabaseProducts(): Promise<Product[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabaseAdmin()
      .from("products")
      .select("id,catalog_id,slug,name,tagline,description,key_benefits,key_ingredients,full_ingredient_list,skin_hair_type,how_to_use,category,concern_tags,routine_tags,price_inr,compare_at_price_inr,stock_quantity,sku,images,before_after_images,is_bestseller,is_featured,status")
      .eq("status", "live")
      .order("catalog_id", { ascending: true });
    if (error) throw error;
    if (!data?.length) return null;
    return data.map((row) => fromDatabase(row as Record<string, unknown>));
  } catch (err) {
    console.error("Supabase catalog fetch failed, falling back:", err);
    return null;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  if (isShopifyConfigured()) {
    try {
      return (await fetchShopifyProducts()).map(withMainImage);
    } catch (err) {
      console.error("Shopify fetch failed, trying Supabase/local catalog:", err);
    }
  }

  const databaseProducts = await getDatabaseProducts();
  if (databaseProducts) return databaseProducts;
  return local.getProducts().map(withMainImage);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  if (isShopifyConfigured()) {
    try {
      const product = await fetchShopifyProductByHandle(slug);
      if (product) return withMainImage(product);
    } catch (err) {
      console.error("Shopify fetch failed, trying Supabase/local catalog:", err);
    }
  }

  const databaseProducts = await getDatabaseProducts();
  const databaseProduct = databaseProducts?.find((product) => product.slug === slug);
  if (databaseProduct) return databaseProduct;
  const localProduct = local.getProductBySlug(slug);
  return localProduct ? withMainImage(localProduct) : undefined;
}

export async function getFeatured(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.is_featured);
}

export async function getByConcern(concern: string): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.concern_tags.includes(concern));
}

export async function getBySubrange(subrange: string): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.subrange === subrange);
}

export async function getByCategory(category: Product["category"]): Promise<Product[]> {
  if (isShopifyConfigured()) {
    const handle = category === "skincare" ? "skin-care" : category === "haircare" ? "hair-care" : "body-care";
    try {
      const collection = await fetchShopifyCollectionProducts(handle);
      if (collection) return collection.products;
    } catch (err) {
      console.error("Shopify collection fetch failed, falling back:", err);
    }
  }

  const all = await getAllProducts();
  return all.filter((p) => p.category === category);
}
