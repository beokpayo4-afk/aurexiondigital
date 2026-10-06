import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";

type CategoryOption = {
  slug: string;
  name: string;
};

type ProductFilterProps = {
  query: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
  categorySlug?: string;
  categories: CategoryOption[];
  onQuery: (value: string) => void;
  onSort: (value: string) => void;
  onMinPrice: (value: string) => void;
  onMaxPrice: (value: string) => void;
  onSubmit: () => void;
};

export function ProductFilter({
  query,
  sort,
  minPrice,
  maxPrice,
  categorySlug,
  categories,
  onQuery,
  onSort,
  onMinPrice,
  onMaxPrice,
  onSubmit,
}: ProductFilterProps) {
  return (
    <form
      className="grid gap-4 rounded-xl border border-line bg-white p-5 shadow-card md:grid-cols-2 xl:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="text-sm font-medium text-ink">
        Search
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          className="field"
        />
      </label>
      <label className="text-sm font-medium text-ink">
        Sort
        <select value={sort} onChange={(event) => onSort(event.target.value)} className="field">
          <option value="sort_order">Featured</option>
          <option value="name">Name</option>
          <option value="price">Price, low to high</option>
          <option value="-price">Price, high to low</option>
          <option value="-created_at">Newest</option>
        </select>
      </label>
      <label className="text-sm font-medium text-ink">
        Minimum price
        <input
          inputMode="decimal"
          value={minPrice}
          onChange={(event) => onMinPrice(event.target.value)}
          className="field"
        />
      </label>
      <label className="text-sm font-medium text-ink">
        Maximum price
        <input
          inputMode="decimal"
          value={maxPrice}
          onChange={(event) => onMaxPrice(event.target.value)}
          className="field"
        />
      </label>
      <div className="md:col-span-2 xl:col-span-4">
        <p className="text-sm font-medium text-ink">Category</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link to="/shop" className={`min-h-11 rounded-md border px-4 py-2 text-sm ${categorySlug ? "border-line" : "surface-dark border-[#102033]"}`}>
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/shop/category/${category.slug}`}
              className={`min-h-11 rounded-md border px-4 py-2 text-sm ${
                category.slug === categorySlug ? "surface-dark border-[#102033]" : "border-line"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
      <Button type="submit">Apply</Button>
    </form>
  );
}
