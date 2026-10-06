import { PageIntro } from "@/components/layout/PageIntro";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
import { Container } from "@/components/ui/Container";
import { usePageTitle } from "@/hooks/usePageTitle";

export function ShopPage() {
  usePageTitle("Shop", "Digital products, software, SaaS tools, and business resources.");

  return (
    <>
      <PageIntro
        eyebrow="Shop"
        title="Shop"
        description="Digital products, software, SaaS tools, and business resources. Search the list and add an item to the cart when it has a price."
      />
      <section className="bg-paper">
        <Container className="py-16 sm:py-20">
          <ShopCatalog />
        </Container>
      </section>
    </>
  );
}
