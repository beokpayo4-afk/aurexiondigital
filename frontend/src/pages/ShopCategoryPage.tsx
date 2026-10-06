import { useParams } from "react-router-dom";

import { PageIntro } from "@/components/layout/PageIntro";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
import { Container } from "@/components/ui/Container";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { listShopCategories } from "@/services/shopService";

export function ShopCategoryPage() {
  const { slug = "" } = useParams();
  const categories = useAsyncData(() => listShopCategories(), []);
  const category = categories.data?.find((item) => item.slug === slug);
  const title = category?.name ?? "Shop category";
  usePageTitle(title, "Published products in this shop category.");

  return (
    <>
      <PageIntro
        eyebrow="Shop"
        title={title}
        description="Published products in this shop category."
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Shop", to: "/shop" },
          { label: title },
        ]}
      />
      <section className="bg-paper">
        <Container className="py-16 sm:py-20">
          <ShopCatalog categorySlug={slug} />
        </Container>
      </section>
    </>
  );
}
