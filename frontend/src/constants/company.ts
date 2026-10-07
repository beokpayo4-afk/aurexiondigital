export const AREAS = [
  {
    id: "marketing-advertising",
    title: "Marketing & Advertising",
    href: "/solutions?area=marketing-advertising",
    activities: [
      "Digital marketing",
      "Social media marketing",
      "Influencer marketing",
      "Search engine optimization (SEO)",
      "Online advertisement services",
      "Branding services",
      "Media buying",
      "Performance marketing",
      "Affiliate marketing",
      "Public relations",
      "Content creation",
      "Lead generation",
      "Marketing consultancy for individuals, businesses, startups, and organizations",
      "Media production",
      "Advertisement film production",
      "Video editing services",
      "Graphic designing services",
      "Computer animation services",
      "Identity branding services",
      "Digital content management systems",
    ],
  },
  {
    id: "technology-digital-products",
    title: "Technology & Digital Products",
    href: "/technology",
    activities: [
      "E-commerce, online trading, online retailing, and wholesale trading",
      "Selling of software as a service (SaaS)",
      "Digital product distribution",
      "Online subscriptions",
      "Automation tools",
      "Business management software",
      "Productivity tools",
      "Analytics tools",
      "Legally permissible online commercial and direct retail activities",
      "Import, export, distribution, licensing, franchising, reselling, agency representation, and direct trading of software products, electronic components, digital services, technology solutions, and enterprise support systems",
    ],
  },
  {
    id: "education-academy",
    title: "Education / Aurexion Academy",
    href: "/academy",
    activities: [
      "Training",
      "Vocational education",
      "Corporate workshops",
      "Seminars",
      "Webinars",
      "Online coaching",
      "Skill development programs",
      "Digital learning platforms",
      "Mentorship programs",
      "Educational advisory in technology, marketing, business management, and entrepreneurship",
    ],
  },
  {
    id: "business-solutions",
    title: "Business Solutions",
    href: "/solutions?area=business-solutions",
    activities: [
      "Business consultancy",
      "Marketing consultancy",
      "Management consultancy",
      "Operational consultancy",
      "Startup consultancy",
      "Digital transformation consultancy",
      "Technology implementation consultancy",
      "Customer support services",
      "Non-financial business advisory services",
      "Trade facilitation services",
      "Digital commerce infrastructure support services",
      "Technical support services",
      "Operational coordination services",
      "Other legally permissible business support activities in accordance with applicable laws",
      "Outsourced manpower solutions",
      "Recruitment backend support",
      "Freelance vendor coordination",
      "Project management services",
      "Vendor workflow management systems",
      "Workforce support services",
    ],
  },
] as const;

export type AreaId = (typeof AREAS)[number]["id"];

export function areaById(id: string | null | undefined) {
  return AREAS.find((area) => area.id === id) ?? null;
}

export function areaTitle(id: string): string {
  return areaById(id)?.title ?? id;
}

export const FAQ_ITEMS = [
  {
    question: "How do I ask for a quote?",
    answer:
      "Open Custom Quote, choose a business area, and describe the work. If a published service matches, you can attach it to the request.",
  },
  {
    question: "Where is the company registered?",
    answer:
      "The published address is Flat No. S2-Plot 129 E6-A, RERA Colony, Near Sai Board, Bagroda, Bhopal – 462026, Madhya Pradesh, India. Phone +91 9153940559. Email aurexiondigital@gmail.com.",
  },
  {
    question: "When do services, products, and courses appear?",
    answer:
      "Published services appear on Solutions. Published technology and shop products appear on those pages. Published courses appear in the Academy.",
  },
  {
    question: "Is a contact message the same as a quote?",
    answer: "No. The contact form sends a general message. A quote request asks for a response against a business area or service.",
  },
] as const;
