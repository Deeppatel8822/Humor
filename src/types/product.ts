export interface KeyIngredient {
  name: string;
  explanation: string;
}

export interface BeforeAfterImage {
  before: string;
  after: string;
  caption?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  key_benefits: string[];
  key_ingredients: KeyIngredient[];
  full_ingredient_list: string | null;
  skin_hair_type: string[];
  how_to_use: string | null;
  category: "skincare" | "haircare" | "bodycare";
  subrange: string | null; // "Fullmoon" | "Blemish Block" | "Velvet Touch" | null
  concern_tags: string[];
  routine_tags: string[];
  price_inr: number;
  compare_at_price_inr: number | null;
  stock_quantity: number;
  sku: string;
  shopify_variant_id: string | null;
  images: string[];
  before_after_images: BeforeAfterImage[];
  is_bestseller: boolean;
  is_featured: boolean;
  is_new: boolean;
  rating: number;
  review_count: number;
  status: "draft" | "live";
}

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  photo_urls: string[];
  video_url: string | null;
  is_verified_purchase: boolean;
  created_at: string;
}
