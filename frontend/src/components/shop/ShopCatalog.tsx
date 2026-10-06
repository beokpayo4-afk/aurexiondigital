import { useState } from "react";

import { ProductFilter } from "@/components/shop/ProductFilter";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useCart } from "@/context/useCart";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listShopCategories, listShopProducts } from "@/services/shopService";

type ShopCatalogProps = {
  categorySlug?: string;
};

export function ShopCatalog({ categorySlug }: ShopCatalogProps) {
  const { add } = useCart();
  const categories = useAsyncData(() => listShopCategories(), []);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("sort_order");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [applied, setApplied] = useState({ q: "", sort: "sort_order", min: "", max: "" });
  const category = categories.data?.find((item) => item.slug === categorySlug);
  const categoryReady = !categorySlug || Boolean(category);
  const products = useAsyncData(async () => {
    if (!categoryReady) {
      return { items: [], page: 1, page_size: 50, total: 0 };
    }
    return listShopProducts({
      q: applied.q || undefined,
      sort: applied.sort,
      min_price: applied.min || undefined,
      max_price: applied.max || undefined,
      category_id: category?.id,
    });
  }, [applied, category?.id, categorySlug, categoryReady]);

  return (
    <div className="space-y-8">
      <ProductFilter
        query={query}
        sort={sort}
        minPrice={minPrice}
        maxPrice={maxPrice}
        categorySlug={categorySlug}
        categories={categories.data ?? []}
        onQuery={setQuery}
        onSort={(value) => {
          setSort(value);
          setApplied((current) => ({ ...current, sort: value }));
        }}
        onMinPrice={setMinPrice}
        onMaxPrice={setMaxPrice}
        onSubmit={() => setApplied({ q: query.trim(), sort, min: minPrice.trim(), max: maxPrice.trim() })}
      />
      {categories.error ? <ErrorState message={categories.error} onRetry={categories.reload} /> : null}
      {!categories.error && (categories.loading || !categoryReady || products.loading) ? <LoadingState label="Loading products" /> : null}
      {products.error ? <ErrorState message={products.error} onRetry={products.reload} /> : null}
      {categorySlug && !categories.loading && !category ? (
        <EmptyState title="This category is not published" description="Choose another shop category." />
      ) : null}
      {categoryReady && !products.loading && !products.error && products.data?.items.length === 0 ? (
        <EmptyState title="No products match" description="Try a different search or category." />
      ) : null}
      {products.data && products.data.items.length > 0 ? <ProductGrid products={products.data.items} onAdd={(product) => void add(product.id)} /> : null}
    </div>
  );
}
