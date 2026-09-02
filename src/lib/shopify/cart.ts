import { shopifyFetch } from "./client";
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  GET_CART_QUERY,
} from "./queries";

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: { amount: string; currencyCode: string };
    product: { title: string; handle: string; featuredImage: { url: string; altText: string | null } | null };
  };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
  };
  lines: { edges: { node: ShopifyCartLine }[] };
}

interface CartMutationResult {
  cart: ShopifyCart | null;
  userErrors: { field: string[]; message: string }[];
}

function assertNoErrors(result: CartMutationResult, action: string) {
  if (result.userErrors?.length) {
    throw new Error(`Shopify cart ${action} failed: ${result.userErrors.map((e) => e.message).join(", ")}`);
  }
  if (!result.cart) {
    throw new Error(`Shopify cart ${action} returned no cart.`);
  }
}

export async function createCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartCreate: CartMutationResult }>({
    query: CART_CREATE_MUTATION,
    variables: { lines },
    cache: "no-store",
  });
  assertNoErrors(data.cartCreate, "create");
  return data.cartCreate.cart!;
}

export async function addCartLines(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartLinesAdd: CartMutationResult }>({
    query: CART_LINES_ADD_MUTATION,
    variables: { cartId, lines },
    cache: "no-store",
  });
  assertNoErrors(data.cartLinesAdd, "add");
  return data.cartLinesAdd.cart!;
}

export async function updateCartLines(
  cartId: string,
  lines: { id: string; quantity: number }[]
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartLinesUpdate: CartMutationResult }>({
    query: CART_LINES_UPDATE_MUTATION,
    variables: { cartId, lines },
    cache: "no-store",
  });
  assertNoErrors(data.cartLinesUpdate, "update");
  return data.cartLinesUpdate.cart!;
}

export async function removeCartLines(cartId: string, lineIds: string[]): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartLinesRemove: CartMutationResult }>({
    query: CART_LINES_REMOVE_MUTATION,
    variables: { cartId, lineIds },
    cache: "no-store",
  });
  assertNoErrors(data.cartLinesRemove, "remove");
  return data.cartLinesRemove.cart!;
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<{ cart: ShopifyCart | null }>({
    query: GET_CART_QUERY,
    variables: { cartId },
    cache: "no-store",
  });
  return data.cart;
}
