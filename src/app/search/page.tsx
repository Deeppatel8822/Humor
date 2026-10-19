import { getAllProducts } from "@/lib/catalog";
import SearchResults from "./SearchResults";

export const revalidate = 60;

export default async function SearchPage() {
  const products = await getAllProducts();
  return <SearchResults products={products.filter((product) => product.status === "live")} />;
}
