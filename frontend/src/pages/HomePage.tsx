import { motion, useReducedMotion } from "framer-motion";
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
import { DIVISIONS, HELP_AREAS, WHY } from "@/constants/home";
import { SITE } from "@/constants/site";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { listFeaturedCourses, listFeaturedProducts, listFeaturedServices, listTestimonials } from "@/services/catalogService";
import { getHomepage } from "@/services/contentService";
import { websiteData } from "@/seo/structuredData";
import { safeUrl } from "@/utils/safeUrl";
import type { Product } from "@/types/catalog";

const TECHNOLOGY_TYPES = new Set(["software", "saas", "digital"]);

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

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
  usePageTitle("Technology. Marketing. Growth.");
  const reduce = useReducedMotion();
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

  return (
    <>
      <JsonLd data={websiteData(window.location.origin)} />
      <section className="surface-dark relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,176,214,0.22),transparent_42%)]" />
        <Container className="relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.12fr_0.88fr] lg:py-24">
          <motion.div
            initial={reduce ? false : "hidden"}
            animate="show"
            variants={reduce ? undefined : { show: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.p variants={rise} className="text-xs font-semibold uppercase tracking-[0.22em] text-champagne-deep">
              {SITE.name}
            </motion.p>
            <motion.h1 variants={rise} className="mt-5 max-w-3xl text-balance font-display text-5xl leading-tight sm:text-6xl lg:text-7xl">
              Technology. Marketing. Growth.
            </motion.h1>
            <motion.p variants={rise} className="mt-6 max-w-xl text-base leading-7 text-night/75 sm:text-lg">
              {SITE.description}
            </motion.p>
            <motion.div variants={rise} className="mt-8 flex flex-wrap gap-3">
              <Button to="/quote?area=marketing-advertising">Grow My Business</Button>
              <Button to="/technology" variant="secondary" tone="dark">
                Explore Technology
              </Button>
              <Button to="/academy" variant="secondary" tone="dark">
                Explore Courses
              </Button>
              <Button to="/shop" variant="secondary" tone="dark">
                Explore Products
              </Button>
            </motion.div>
          </motion.div>
          <motion.figure
            className="overflow-hidden border border-night/10 bg-white shadow-[0_24px_80px_rgba(16,32,51,0.12)]"
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <ContentImage
              src="/hero.jpg"
              alt="Dark glass interior with rising gold light, suggesting technology and growth."
              width={1280}
              height={720}
              priority
              className="aspect-video h-auto w-full object-cover"
            />
          </motion.figure>
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
            <SectionHeading id="help-heading" eyebrow="Where to start" title="What Can We Help You With?" />
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {HELP_AREAS.map((area, index) => (
              <Reveal key={area.title} delay={index * 0.05} className="h-full">
                <Card className="flex h-full flex-col">
                  <h3 className="font-display text-4xl leading-tight">{area.title}</h3>
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

      <section className="surface-dark" aria-labelledby="divisions-heading">
        <Container className="py-20 sm:py-24 lg:py-28">
          <Reveal>
            <SectionHeading id="divisions-heading" tone="dark" title="One Company. Multiple Growth Solutions." />
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {DIVISIONS.map((division, index) => (
              <Reveal key={division.name} delay={index * 0.03}>
                <Link
                  to={division.href}
                  className="flex min-h-28 items-end break-words border border-night/10 bg-white/70 p-5 font-display text-3xl leading-tight text-night transition-colors hover:border-champagne-deep"
                >
                  {division.name}
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <FeaturedSection
        id="featured-services"
        eyebrow="Services"
        title="Featured Services"
        description="Published services are listed here as they are offered."
      >
        <CatalogBlock
          loading={services.loading}
          error={services.error}
          onRetry={services.reload}
          loadingLabel="Loading services"
          hasItems={Boolean(services.data && services.data.items.length > 0)}
          emptyTitle="No published services yet"
          emptyDescription="A marketing plan can still be requested while the service list is being prepared."
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

      <FeaturedSection
        id="featured-technology"
        eyebrow="Technology"
        title="Featured Technology"
        description="Published software, SaaS, and digital products on the technology channel."
        surface="white"
      >
        <CatalogBlock
          loading={technologyProducts.loading || sharedProducts.loading}
          error={technologyProducts.error ?? sharedProducts.error}
          onRetry={() => {
            technologyProducts.reload();
            sharedProducts.reload();
          }}
          loadingLabel="Loading technology"
          hasItems={technologyItems.length > 0}
          emptyTitle="No published technology yet"
          emptyDescription="Software, SaaS, and digital products appear here when they are published."
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

      <FeaturedSection
        id="featured-products"
        eyebrow="Shop"
        title="Featured Products"
        description="Published products placed on the shop channel."
      >
        <CatalogBlock
          loading={homepage.loading || (needsShop && !shopProducts.error && (shopProducts.loading || shopProducts.data === null || sharedProducts.loading))}
          error={needsShop ? (shopProducts.error ?? sharedProducts.error) : null}
          onRetry={() => {
            shopProducts.reload();
            sharedProducts.reload();
          }}
          loadingLabel="Loading products"
          hasItems={featuredProducts.length > 0 || shopItems.length > 0}
          emptyTitle="No published products yet"
          emptyDescription="Shop products appear here after they are published."
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

      <FeaturedSection
        id="featured-courses"
        eyebrow="Academy"
        title="Featured Courses"
        description="Published academy courses."
        surface="white"
      >
        <CatalogBlock
          loading={homepage.loading || (needsCourses && !courses.error && (courses.loading || courses.data === null))}
          error={needsCourses ? courses.error : null}
          onRetry={courses.reload}
          loadingLabel="Loading courses"
          hasItems={featuredCourses.length > 0 || Boolean(courses.data && courses.data.items.length > 0)}
          emptyTitle="No published courses yet"
          emptyDescription="Courses, workshops, and training appear here when they are published."
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

      <section className="bg-paper" aria-labelledby="why-heading">
        <Container className="py-20 sm:py-24 lg:py-28">
          <Reveal>
            <SectionHeading id="why-heading" eyebrow="The company" title="Why Aurexion" />
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {WHY.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.04}>
                <Card className="h-full">
                  <h3 className="font-display text-4xl">{item.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-ink/75">{item.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <FeaturedSection
        id="testimonials"
        eyebrow="Clients"
        title="Testimonials"
        description="Published comments from people who have worked with Aurexion Digital."
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

      <CTASection
        title="Start a custom campaign."
        description="Describe the marketing, advertising, technology, or education work you need. A quote request is separate from a general message."
        primary={{ to: "/quote?area=marketing-advertising", label: "Get a Marketing Plan" }}
        secondary={{ to: "/custom-quote", label: "Request Custom Quote" }}
      />

      <section className="bg-paper" aria-labelledby="contact-heading">
        <Container className="grid gap-12 py-20 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <SectionHeading
              id="contact-heading"
              eyebrow="Contact"
              title="Speak with Aurexion Digital."
              description="Call, email, or send a message. The address below is the published address in Bhopal."
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
  eyebrow,
  title,
  description,
  surface = "paper",
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  surface?: "paper" | "white";
  children: ReactNode;
}) {
  return (
    <section className={surface === "white" ? "bg-white" : "bg-paper"} aria-labelledby={id}>
      <Container className="py-20 sm:py-24">
        <Reveal>
          <SectionHeading id={id} eyebrow={eyebrow} title={title} description={description} />
        </Reveal>
        <div className="mt-10">{children}</div>
      </Container>
    </section>
  );
}
