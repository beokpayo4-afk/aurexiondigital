import { ProductCard } from "@/components/cards/ProductCard";
import type { Product } from "@/types/catalog";

type ProductGridProps = {
  products: Product[];
  onAdd?: (product: Product) => void;
};

function activePrice(product: Product) {
  return product.prices.find((item) => item.is_active) ?? product.prices[0];
}

export function ProductGrid({ products, onAdd }: ProductGridProps) {
  return (
    <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const price = activePrice(product);
        return (
          <ProductCard
            key={product.id}
            name={product.name}
            summary={product.summary}
            productType={product.product_type}
            amount={price?.amount}
            currency={price?.currency}
            billingPeriod={price?.billing_period}
            href={`/shop/product/${product.slug}`}
            onAdd={onAdd && price ? () => onAdd(product) : undefined}
          />
        );
      })}
    </div>
  );
}
