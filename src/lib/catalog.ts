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
