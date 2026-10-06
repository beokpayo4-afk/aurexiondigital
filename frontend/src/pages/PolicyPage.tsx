import { PageIntro } from "@/components/layout/PageIntro";
import { ContactDetails } from "@/components/company/ContactDetails";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/constants/site";
import { usePageTitle } from "@/hooks/usePageTitle";

type PolicySection = { heading: string; body: string[] };

const POLICIES: Record<string, { title: string; intro: string; sections: PolicySection[] }> = {
  privacy: {
    title: "Privacy Policy",
    intro: `${SITE.name} collects only the details needed to reply, deliver an order, or run a course.`,
    sections: [
      {
        heading: "What we collect",
        body: [
          "Contact forms collect your name, email, phone, and message.",
          "Checkout collects your name, email, phone, and shipping and billing address.",
          "An account stores your name, email, phone, and the orders placed with that account.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "We use these details to answer you, fulfil an order, send an order confirmation, and keep a record of the sale.",
          "We do not sell personal information.",
          "Payment card numbers are not stored on this website.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Order records are kept as business records.",
          "You can ask us to correct your contact details by writing to the email below.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: `These terms apply to the website, shop, and services of ${SITE.name}.`,
    sections: [
      {
        heading: "Orders",
        body: [
          "A product or service is offered at the price shown at checkout.",
          "Placing an order creates a pending payment. The order is fulfilled after payment is confirmed.",
          "Digital products are delivered to the email on the order. Services start after the scope is confirmed.",
        ],
      },
      {
        heading: "Accounts",
        body: [
          "You are responsible for the activity on your account.",
          "Do not share your password. Sign out on a shared device.",
        ],
      },
      {
        heading: "Use of the site",
        body: [
          "The content on this site belongs to Aurexion Digital unless a product says otherwise.",
          "A package price is a starting service fee unless the package says third-party costs are included.",
        ],
      },
    ],
  },
  refund: {
    title: "Refund Policy",
    intro: "Refunds depend on whether the item is a digital download or a service that has already started.",
    sections: [
      {
        heading: "Digital products",
        body: [
          "If a digital file cannot be delivered, we will replace it or refund the amount paid for that item.",
          "A download that has already been delivered is not refunded unless the file is defective.",
        ],
      },
      {
        heading: "Services",
        body: [
          "A service fee can be refunded before work starts.",
          "After work has started, any refund is limited to the unused portion and is confirmed in writing.",
          "Third-party advertising or creator costs that have already been paid are not refunded by Aurexion.",
        ],
      },
      {
        heading: "How to ask",
        body: ["Write to the email below with your order number. We reply with the decision and the next step."],
      },
    ],
  },
  security: {
    title: "Data Security Policy",
    intro: "We protect account and order data with access controls and encrypted connections.",
    sections: [
      {
        heading: "On the website",
        body: [
          "The public site and the API are served over HTTPS.",
          "Passwords are stored as hashes. We do not store card numbers.",
          "A signed-in session uses a token kept in the browser for that visit.",
        ],
      },
      {
        heading: "On the server",
        body: [
          "Order and customer records are stored in a private database.",
          "Staff access is limited to admin and staff accounts.",
          "Download files for paid products stay private until payment succeeds.",
        ],
      },
      {
        heading: "If something goes wrong",
        body: ["If you believe an account was used without permission, write to us and change your password."],
      },
    ],
  },
};

export function PolicyPage({ kind }: { kind: keyof typeof POLICIES }) {
  const policy = POLICIES[kind];
  usePageTitle(policy.title);

  return (
    <>
      <PageIntro eyebrow={SITE.shortName} title={policy.title} description={policy.intro} />
      <section className="bg-paper">
        <Container className="grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-10">
            {policy.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-semibold">{section.heading}</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/80">
                  {section.body.map((paragraph) => (
                    <li key={paragraph}>{paragraph}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <aside className="rounded-xl border border-line bg-white p-6">
            <p className="text-sm font-semibold">{SITE.name}</p>
            <div className="mt-4">
              <ContactDetails />
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
