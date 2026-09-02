// Shared fragment — keep every field the adapter's mapProduct() reads in sync
// with this fragment, or new fields will silently come back as undefined.
export const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    productType
    tags
    availableForSale
    totalInventory
    featuredImage {
      url
      altText
    }
    images(first: 10) {
      edges { node { url altText } }
    }
    priceRange {
      minVariantPrice { amount currencyCode }
    }
    compareAtPriceRange {
      minVariantPrice { amount currencyCode }
    }
    variants(first: 10) {
      edges {
        node {
          id
          title
          availableForSale
          quantityAvailable
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
        }
      }
    }
    metafields(identifiers: [
      { namespace: "humor_luxury", key: "key_benefits" },
      { namespace: "humor_luxury", key: "key_ingredients" },
      { namespace: "humor_luxury", key: "full_ingredient_list" },
      { namespace: "humor_luxury", key: "skin_hair_type" },
      { namespace: "humor_luxury", key: "how_to_use" },
      { namespace: "humor_luxury", key: "subrange" },
      { namespace: "humor_luxury", key: "concern_tags" },
      { namespace: "humor_luxury", key: "routine_tags" },
    ]) {
      key
      value
    }
  }
`;

export const GET_PRODUCTS_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges { node { ...ProductFields } }
    }
  }
`;

export const GET_PRODUCT_BY_HANDLE_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
`;

export const GET_COLLECTIONS_QUERY = `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          image { url altText }
        }
      }
    }
  }
`;

export const GET_COLLECTION_PRODUCTS_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetCollectionProducts($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      title
      description
      products(first: $first) {
        edges { node { ...ProductFields } }
      }
    }
  }
`;

export const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              price { amount currencyCode }
              product { title handle featuredImage { url altText } }
            }
          }
        }
      }
    }
  }
`;

export const CART_CREATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_ADD_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_UPDATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_REMOVE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const GET_CART_QUERY = `
  ${CART_FRAGMENT}
  query GetCart($cartId: ID!) {
    cart(id: $cartId) { ...CartFields }
  }
`;
