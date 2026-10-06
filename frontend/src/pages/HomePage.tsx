import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { CourseCard } from "@/components/cards/CourseCard";
import { ProductCard } from "@/components/cards/ProductCard";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { TestimonialCard } from "@/components/cards/TestimonialCard";
import { ContactDetails } from "@/components/company/ContactDetails";
import { CatalogBlock } from "@/components/home/CatalogBlock";
import { Reveal } from "@/components/motion/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/Button";
import { CTASection } from "@/components/ui/CTASection";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { ContentImage } from "@/components/ui/ContentImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DIVISIONS, HELP_AREAS } from "@/constants/home";
import { SITE } from "@/constants/site";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { listFeaturedCourses, listFeaturedProducts, listFeaturedServices, listTestimonials } from "@/services/catalogService";
import { getHomepage } from "@/services/contentService";
import { websiteData } from "@/seo/structuredData";
import { safeUrl } from "@/utils/safeUrl";
import type { Product } from "@/types/catalog";

const TECHNOLOGY_TYPES = new Set(["software", "saas", "digital"]);

function uniqueProducts(groups: Product[][], predicate?: (product: Product) => boolean) {
  const seen = new Set<string>();
  const items: Product[] = [];
  for (const group of groups) {
    for (const product of group) {
      if (seen.has(product.id) || (predicate && !predicate(product))) {
        continue;
      }
      seen.add(product.id);
      items.push(product);
    }
  }
  return items.slice(0, 3);
}

function productPrice(product: Product) {
  return product.prices.find((item) => item.is_active) ?? product.prices[0];
}

export function HomePage() {
  usePageTitle("Aurexion Digital");
  const homepage = useAsyncData(() => getHomepage(), []);
  const featuredProducts = homepage.data?.featured_products ?? [];
  const featuredCourses = homepage.data?.featured_courses ?? [];
  const banners = homepage.data?.banners ?? [];
  const needsShop = !homepage.loading && featuredProducts.length === 0;
  const needsCourses = !homepage.loading && featuredCourses.length === 0;
  const services = useAsyncData(() => listFeaturedServices(), []);
  const testimonials = useAsyncData(() => listTestimonials(), []);
  const sharedProducts = useAsyncData(() => listFeaturedProducts("both"), []);
  const technologyProducts = useAsyncData(() => listFeaturedProducts("technology"), []);
  const shopProducts = useAsyncData(() => listFeaturedProducts("shop"), [needsShop], { enabled: needsShop });
  const courses = useAsyncData(() => listFeaturedCourses(), [needsCourses], { enabled: needsCourses });
  const technologyItems = uniqueProducts([technologyProducts.data?.items ?? [], sharedProducts.data?.items ?? []], (product) =>
    TECHNOLOGY_TYPES.has(product.product_type),
  );
  const shopItems = uniqueProducts([shopProducts.data?.items ?? [], sharedProducts.data?.items ?? []]);
  const showServices = services.loading || Boolean(services.error) || Boolean(services.data && services.data.items.length > 0);
  const technologyLoading = technologyProducts.loading || sharedProducts.loading;
  const technologyError = technologyProducts.error ?? sharedProducts.error;
  const showTechnology = technologyLoading || Boolean(technologyError) || technologyItems.length > 0;
  const shopLoading = homepage.loading || (needsShop && !shopProducts.error && (shopProducts.loading || shopProducts.data === null || sharedProducts.loading));
  const shopError = needsShop ? (shopProducts.error ?? sharedProducts.error) : null;
  const showShop = shopLoading || Boolean(shopError) || featuredProducts.length > 0 || shopItems.length > 0;
  const courseLoading = homepage.loading || (needsCourses && !courses.error && (courses.loading || courses.data === null));
  const courseError = needsCourses ? courses.error : null;
  const showCourses = courseLoading || Boolean(courseError) || featuredCourses.length > 0 || Boolean(courses.data && courses.data.items.length > 0);
  const showTestimonials = testimonials.loading || Boolean(testimonials.error) || Boolean(testimonials.data && testimonials.data.items.length > 0);

  return (
    <>
      <JsonLd data={websiteData(window.location.origin)} />
      <section className="border-b border-line bg-white">
        <Container className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <p className="text-sm text-champagne-deep">Bhopal</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">{SITE.shortName}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/80">{SITE.description}</p>
            <p className="mt-3 text-sm text-ink/70">{SITE.positioning}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button to="/quote?area=marketing-advertising">Get a marketing plan</Button>
              <Link to="/technology" className="text-sm font-semibold text-night">
                Technology
              </Link>
              <Link to="/academy" className="text-sm font-semibold text-night">
                Academy
              </Link>
              <Link to="/shop" className="text-sm font-semibold text-night">
                Shop
              </Link>
              <Link to="/contact" className="text-sm font-semibold text-night">
                Contact
              </Link>
            </div>
          </div>
          <ContentImage
            src="/2022.webp"
            alt="Three people meeting around laptops, with a whiteboard behind them."
            width={1536}
            height={1024}
            priority
            className="aspect-[3/2] h-auto w-full rounded-md object-cover"
          />
        </Container>
      </section>

      {banners.length > 0 ? (
        <section className="bg-paper" aria-label="Banners">
          <Container className="grid gap-4 py-10 lg:grid-cols-3">
            {banners.map((banner) => {
              const image = safeUrl(banner.image_url);
              const link = safeUrl(banner.link_url);
              if (!image) {
                return null;
              }
              const content = (
                <>
                  <ContentImage src={image} alt="" className="aspect-video w-full object-cover" />
                  <div className="p-5">
                    <h2 className="font-display text-3xl">{banner.title}</h2>
                    {banner.subtitle ? <p className="mt-2 text-sm text-ink/75">{banner.subtitle}</p> : null}
                  </div>
                </>
              );
              return link ? (
                <a
                  key={banner.id}
                  href={link}
                  className="overflow-hidden rounded-xl border border-line bg-white shadow-card"
                  {...(link.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {content}
                </a>
              ) : (
                <article key={banner.id} className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
                  {content}
                </article>
              );
            })}
          </Container>
        </section>
      ) : null}

      <section className="bg-paper" aria-labelledby="help-heading">
        <Container className="py-20 sm:py-24 lg:py-28">
          <Reveal>
            <SectionHeading id="help-heading" title="Marketing, technology, or training" />
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {HELP_AREAS.map((area, index) => (
              <Reveal key={area.title} delay={index * 0.05} className="h-full">
                <Card className="flex h-full flex-col">
                  <h3 className="text-2xl font-semibold leading-snug">{area.title}</h3>
                  <ul className="mt-6 space-y-2 text-sm leading-6 text-ink/75">
                    {area.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Button to={area.href} tone="light">
                      {area.cta}
                    </Button>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-white" aria-labelledby="divisions-heading">
        <Container className="py-12 sm:py-16">
          <h2 id="divisions-heading" className="text-sm font-semibold text-ink">
            On this site
          </h2>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {DIVISIONS.map((division) => (
              <li key={division.name}>
                <Link to={division.href} className="text-sm text-night underline-offset-4 hover:underline">
                  {division.name}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {showServices ? (
      <FeaturedSection
        id="featured-services"
        title="Services"
        description="Marketing, advertising, creative work, and consulting."
      >
        <CatalogBlock
          loading={services.loading}
          error={services.error}
          onRetry={services.reload}
          loadingLabel="Loading services"
          hasItems={Boolean(services.data && services.data.items.length > 0)}
          emptyTitle="Services"
          emptyDescription="A marketing plan can still be requested."
          emptyAction={{ to: "/quote?area=marketing-advertising", label: "Get a Marketing Plan" }}
        >
          <div className="grid gap-5 lg:grid-cols-3">
            {services.data?.items.slice(0, 3).map((service) => (
              <ServiceCard
                key={service.id}
                name={service.name}
                summary={service.summary}
                area={service.business_area}
                href={`/quote?area=${service.business_area}&service=${service.id}`}
              />
            ))}
          </div>
          <div className="mt-8">
            <Button to="/solutions" variant="secondary" tone="light">
              View solutions
            </Button>
          </div>
        </CatalogBlock>
      </FeaturedSection>
      ) : null}

      {showTechnology ? (
      <FeaturedSection
        id="featured-technology"
        title="Technology"
        description="Software, SaaS, and digital products."
        surface="white"
      >
        <CatalogBlock
          loading={technologyLoading}
          error={technologyError}
          onRetry={() => {
            technologyProducts.reload();
            sharedProducts.reload();
          }}
          loadingLabel="Loading technology"
          hasItems={technologyItems.length > 0}
          emptyTitle="Technology"
          emptyDescription="Software, SaaS, and digital products are listed on the technology page."
          emptyAction={{ to: "/technology", label: "Explore Technology" }}
        >
          <div className="grid gap-5 lg:grid-cols-3">
            {technologyItems.map((product) => {
              const price = productPrice(product);
              return (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  summary={product.summary}
                  productType={product.product_type}
                  amount={price?.amount}
                  currency={price?.currency}
                  billingPeriod={price?.billing_period}
                  href={`/technology/products/${product.slug}`}
                />
              );
            })}
          </div>
          <div className="mt-8">
            <Button to="/technology" variant="secondary" tone="light">
              Explore Technology
            </Button>
          </div>
        </CatalogBlock>
      </FeaturedSection>
      ) : null}

      {showShop ? (
      <FeaturedSection
        id="featured-products"
        title="Shop"
        description="Products you can order from the shop."
      >
        <CatalogBlock
          loading={shopLoading}
          error={shopError}
          onRetry={() => {
            shopProducts.reload();
            sharedProducts.reload();
          }}
          loadingLabel="Loading products"
          hasItems={featuredProducts.length > 0 || shopItems.length > 0}
          emptyTitle="Shop"
          emptyDescription="Products are listed in the shop."
          emptyAction={{ to: "/shop", label: "Explore Products" }}
        >
          <div className="grid gap-5 lg:grid-cols-3">
            {featuredProducts.length > 0
              ? featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    name={product.name}
                    summary={product.summary}
                    productType={product.product_type}
                    amount={product.price_amount}
                    currency={product.currency ?? "INR"}
                    billingPeriod={product.billing_period}
                    href={product.listing_channel === "technology" ? `/technology/products/${product.slug}` : `/shop/product/${product.slug}`}
                  />
                ))
              : shopItems.map((product) => {
                  const price = productPrice(product);
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
                    />
                  );
                })}
          </div>
          <div className="mt-8">
            <Button to="/shop" variant="secondary" tone="light">
              Explore Products
            </Button>
          </div>
        </CatalogBlock>
      </FeaturedSection>
      ) : null}

      {showCourses ? (
      <FeaturedSection
        id="featured-courses"
        title="Academy"
        description="Courses, workshops, and training."
        surface="white"
      >
        <CatalogBlock
          loading={courseLoading}
          error={courseError}
          onRetry={courses.reload}
          loadingLabel="Loading courses"
          hasItems={featuredCourses.length > 0 || Boolean(courses.data && courses.data.items.length > 0)}
          emptyTitle="Academy"
          emptyDescription="Courses are listed in the Academy."
          emptyAction={{ to: "/academy", label: "Explore Aurexion Academy" }}
        >
          <div className="grid gap-5 lg:grid-cols-3">
            {(featuredCourses.length > 0 ? featuredCourses : (courses.data?.items.slice(0, 3) ?? [])).map((course) => (
              <CourseCard
                key={course.id}
                title={course.title}
                summary={course.summary}
                level={course.level}
                duration={course.duration_label}
                priceAmount={course.price_amount}
                currency={course.currency}
                thumbnailUrl={course.thumbnail_url}
                href={`/academy/course/${course.slug}`}
              />
            ))}
          </div>
          <div className="mt-8">
            <Button to="/academy" variant="secondary" tone="light">
              Explore Aurexion Academy
            </Button>
          </div>
        </CatalogBlock>
      </FeaturedSection>
      ) : null}

      {showTestimonials ? (
      <FeaturedSection
        id="testimonials"
        title="From clients"
        description="Comments from people who have worked with Aurexion Digital."
        surface="white"
      >
        <CatalogBlock
          loading={testimonials.loading}
          error={testimonials.error}
          onRetry={testimonials.reload}
          loadingLabel="Loading testimonials"
          hasItems={Boolean(testimonials.data && testimonials.data.items.length > 0)}
          emptyTitle="No published testimonials yet"
          emptyDescription="Comments appear here after they are published. None are shown until then."
        >
          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.data?.items.slice(0, 3).map((item) => (
              <TestimonialCard key={item.id} quote={item.body} name={item.author_name} detail={item.author_role} />
            ))}
          </div>
        </CatalogBlock>
      </FeaturedSection>
      ) : null}

      <CTASection
        title="Tell us what you need."
        description="A quote is for a campaign or a project. The contact form is for a general message."
        primary={{ to: "/quote?area=marketing-advertising", label: "Get a marketing plan" }}
        secondary={{ to: "/custom-quote", label: "Request a quote" }}
      />

      <section className="bg-paper" aria-labelledby="contact-heading">
        <Container className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <SectionHeading
              id="contact-heading"
              title="Call, email, or write."
              description={`${SITE.name} is registered in Madhya Pradesh. The Bhopal address is below.`}
            />
            <div className="mt-8">
              <Button to="/contact" tone="light">
                Send a message
              </Button>
            </div>
          </div>
          <ContactDetails />
        </Container>
      </section>
    </>
  );
}

function FeaturedSection({
  id,
  title,
  description,
  surface = "paper",
  children,
}: {
  id: string;
  title: string;
  description: string;
  surface?: "paper" | "white";
  children: ReactNode;
}) {
  return (
    <section className={surface === "white" ? "bg-white" : "bg-paper"} aria-labelledby={id}>
      <Container className="py-14 sm:py-16">
        <SectionHeading id={id} title={title} description={description} />
        <div className="mt-8">{children}</div>
      </Container>
    </section>
  );
}