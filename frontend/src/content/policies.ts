export type PolicySection = {
  title: string;
  paragraphs: string[];
};

export type PolicyDocument = {
  title: string;
  description: string;
  sections: PolicySection[];
};

export const POLICIES = {
  privacy: {
    title: "Privacy Policy",
    description: "How Aurexion Digital Private Limited collects, uses, and stores information submitted through this website.",
    sections: [
      {
        title: "Information collected",
        paragraphs: [
          "We collect information you submit on this website, including contact forms, service enquiries, account registration, and checkout.",
        ],
      },
      {
        title: "Contact information",
        paragraphs: ["Name, phone number, email address, company name, and the message or requirement you send us."],
      },
      {
        title: "Account information",
        paragraphs: ["If you create an account, we store the name, email, phone number, and password hash needed to sign you in. We do not store your password in readable form."],
      },
      {
        title: "Order and payment information",
        paragraphs: [
          "Orders store the items, amount, billing details, and payment status. Card or UPI credentials are handled by the payment provider when a provider is connected. This website does not ask you to type a card number into an Aurexion form.",
        ],
      },
      {
        title: "Website usage information",
        paragraphs: ["The server may record standard request data such as browser type, pages requested, and the time of the request. This is used to operate and secure the site."],
      },
      {
        title: "Cookies",
        paragraphs: [
          "A sign-in session may use a cookie so you can stay signed in. The shopping cart may use local storage in your browser. You can clear cookies and site data in your browser; signing in and the cart may then need to be started again.",
        ],
      },
      {
        title: "How information is used",
        paragraphs: [
          "We use this information to reply to enquiries, prepare proposals, create accounts, fulfil orders, provide course access, and keep records of what was purchased.",
        ],
      },
      {
        title: "Service providers and payment processors",
        paragraphs: [
          "Hosting, email, and payment processing may be handled by service providers acting on our instructions. A payment provider receives the information needed to collect or refund a payment. Those providers have their own terms.",
        ],
      },
      {
        title: "Data security",
        paragraphs: ["Access to customer and order records is limited to people who need it for the work. No method of storage or transmission is completely secure."],
      },
      {
        title: "Data retention",
        paragraphs: ["Enquiry, account, and order records are kept for as long as they are needed for the service, support, and ordinary business records. You can ask us to review what we hold."],
      },
      {
        title: "Your choices",
        paragraphs: [
          "You can ask for a copy of the contact or order information we hold, ask for a correction, or ask us to delete a message that is no longer needed. Some order records may need to be kept for accounting.",
        ],
      },
      {
        title: "Contact",
        paragraphs: ["Questions about this policy can be sent to aurexiondigital@gmail.com or +91 9153940559."],
      },
      {
        title: "Updates",
        paragraphs: ["If this policy changes, the updated text will be published on this page. The version on this page is the one that applies."],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    description: "Terms for using the Aurexion Digital Private Limited website, buying products, enrolling in courses, and requesting services.",
    sections: [
      {
        title: "Using the website",
        paragraphs: [
          "This website is operated by Aurexion Digital Private Limited. You may use it to read about the company, request a service, create an account, and buy products or courses that are offered for sale.",
        ],
      },
      {
        title: "Accounts",
        paragraphs: ["You are responsible for the email and password on your account and for activity under that account. Tell us if you believe the account is being used without your permission."],
      },
      {
        title: "Product and service descriptions",
        paragraphs: [
          "Pages describe the products, courses, and services offered. A service page is a description of work we can discuss. It is not a promise that every result, placement, or timeline is fixed before the scope is agreed.",
        ],
      },
      {
        title: "Pricing",
        paragraphs: [
          "A product or course price shown at checkout is the amount for that item. A service package marked as a starting price is not the final fee. Final service pricing can change with the campaign, duration, location, media or platform costs, production, third-party charges, and the agreed scope.",
        ],
      },
      {
        title: "Orders",
        paragraphs: ["An order is created when you confirm checkout while signed in. The order summary shows the item names, quantities, and total before you confirm."],
      },
      {
        title: "Payments",
        paragraphs: [
          "Payment stays pending until a configured payment provider confirms it. Confirming an order on this website does not by itself mean a card has been charged. You must accept the Terms & Conditions, Privacy Policy, and Refund & Cancellation Policy before confirming.",
        ],
      },
      {
        title: "Service enquiries",
        paragraphs: [
          "Professional services follow this sequence: package or service, enquiry, consultation, requirement analysis, final proposal, payment, then service execution. Work starts from the agreed proposal, not from a package label alone.",
        ],
      },
      {
        title: "Digital products",
        paragraphs: [
          "Digital products are delivered by download, email, or the customer account after payment is confirmed. Access can be limited once delivery has been made, as described in the Refund & Cancellation Policy.",
        ],
      },
      {
        title: "Courses",
        paragraphs: [
          "Course pages state the price, duration, level, modules, and what is included when that information has been entered. A certificate is mentioned only for a course that has a certificate enabled. Access is through the student account after the order is confirmed.",
        ],
      },
      {
        title: "Intellectual property",
        paragraphs: [
          "The website text, layout, and company name belong to Aurexion Digital Private Limited or its licensors. Buying a product or course gives you the access described on that item. It does not transfer ownership of the underlying materials unless the product terms say so.",
        ],
      },
      {
        title: "Third-party services",
        paragraphs: [
          "Advertising platforms, influencers, hosting, and payment providers have their own terms. A campaign can be affected by those terms, by inventory, and by whether a creator is available.",
        ],
      },
      {
        title: "Prohibited use",
        paragraphs: ["Do not misuse the site, attempt to access another customer’s account or files, or submit unlawful material through a form."],
      },
      {
        title: "Limitation of liability",
        paragraphs: [
          "Marketing and advertising results vary. We do not promise a specific ranking, return, or number of leads. Liability for a paid product or course is limited to the amount paid for that item, except where the law does not allow that limit.",
        ],
      },
      {
        title: "Changes",
        paragraphs: ["Service descriptions, prices, and availability can be updated. An order already placed keeps the items and amount recorded on that order."],
      },
      {
        title: "Governing law",
        paragraphs: ["These terms are governed by the laws of India. The company’s place of business is in Madhya Pradesh."],
      },
      {
        title: "Contact",
        paragraphs: ["Aurexion Digital Private Limited, aurexiondigital@gmail.com, +91 9153940559."],
      },
    ],
  },
  refund: {
    title: "Refund & Cancellation Policy",
    description: "When a refund or cancellation may be available for digital products, services, and courses sold by Aurexion Digital Private Limited.",
    sections: [
      {
        title: "Digital products",
        paragraphs: [
          "Digital products may be delivered or made available immediately after payment is confirmed. Because of that, a refund can be limited once delivery or access has been provided. Any refund remains subject to applicable law and the terms shown for that product.",
        ],
      },
      {
        title: "Services",
        paragraphs: [
          "Cancellation or refund of a professional service depends on the stage of the work, the work already completed, third-party costs, advertising or media costs, production costs, customized work, and the approved project scope. A starting price on a package is not a promise that the full fee is refundable.",
        ],
      },
      {
        title: "Courses",
        paragraphs: [
          "Course cancellation and refunds follow the terms stated for that course. If a course has already been opened or a certificate has been issued where a certificate is enabled, a refund may no longer be available.",
        ],
      },
      {
        title: "Refund processing",
        paragraphs: [
          "Where a refund is approved, it is generally sent back through the original payment method. The time it takes to appear depends on the payment provider and the bank. We do not promise a refund in every situation.",
        ],
      },
      {
        title: "How to ask",
        paragraphs: ["Write to aurexiondigital@gmail.com with the order number, the item, and the reason. We will reply with whether that order can be cancelled or refunded."],
      },
    ],
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    description: "How Aurexion Digital Private Limited delivers digital products, physical products, and professional services.",
    sections: [
      {
        title: "Digital products",
        paragraphs: [
          "Digital products are not shipped by courier. After payment is confirmed, access is provided by download, email, the customer account, or the dashboard, depending on the product.",
        ],
      },
      {
        title: "Physical products",
        paragraphs: [
          "If a physical product is offered, checkout asks for a shipping address. Processing time and a delivery estimate are shown on that product when they have been set. We do not publish a delivery time that has not been defined. Delays can come from the courier or from an incomplete address. If a package arrives damaged, write to aurexiondigital@gmail.com with the order number and photographs of the package.",
        ],
      },
      {
        title: "Services",
        paragraphs: [
          "Services are delivered according to the timeline and scope in the agreed proposal. A service page does not set a fixed delivery date by itself.",
        ],
      },
    ],
  },
  disclaimer: {
    title: "Disclaimer",
    description: "Limits on the information published by Aurexion Digital Private Limited.",
    sections: [
      {
        title: "General information",
        paragraphs: ["Pages on this website are for general business information. They are not a final proposal, a legal opinion, or a guarantee of a business outcome."],
      },
      {
        title: "Results",
        paragraphs: [
          "Service results vary. Marketing results are not guaranteed. Rankings, leads, sales, and return on spend depend on the offer, the market, the budget, and the platforms used.",
        ],
      },
      {
        title: "Advertising and creators",
        paragraphs: [
          "Advertising inventory and placement depend on availability. Influencer and creator availability can change. Third-party platform policies can change a campaign after it has been planned.",
        ],
      },
      {
        title: "Prices",
        paragraphs: ["Prices can change when the requirement changes. A starting price is the starting service fee, not a fixed quote."],
      },
      {
        title: "Third parties",
        paragraphs: ["Payment providers, advertising platforms, and other third-party services have their own terms. Those terms apply to the part of the work they perform."],
      },
      {
        title: "Updates",
        paragraphs: ["Product, course, and service information can be updated. The page you are reading is the current description."],
      },
    ],
  },
  company: {
    title: "Company Information",
    description: "Registered business details published by Aurexion Digital Private Limited for customers and payment-gateway review.",
    sections: [
      {
        title: "Business",
        paragraphs: [
          "Aurexion Digital Private Limited",
          "Technology, marketing, advertising, education, and business solutions.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [
          "Phone: +91 9153940559",
          "Email: aurexiondigital@gmail.com",
          "Flat No. S2-Plot 129 E6-A, RERA Colony, Near Sai Board, Bagroda, Bhopal – 462026, Madhya Pradesh, India",
        ],
      },
      {
        title: "Registration numbers",
        paragraphs: [
          "CIN: to be entered by the company. This site does not publish a CIN until the company adds the number from its incorporation records.",
          "GSTIN: to be entered by the company if GST registration applies. This site does not publish a GSTIN until that number is provided.",
        ],
      },
    ],
  },
  security: {
    title: "Data Security",
    description: "How Aurexion Digital Private Limited handles account access, orders, and files.",
    sections: [
      {
        title: "Accounts and orders",
        paragraphs: [
          "Customer accounts are protected with a password. Orders and downloads are available only to the signed-in customer who placed them, and to staff who need them for support.",
        ],
      },
      {
        title: "Payments",
        paragraphs: ["Payment provider secrets are kept on the server. They are not placed in the website code that runs in the browser."],
      },
      {
        title: "Contact",
        paragraphs: ["If you notice a security problem, email aurexiondigital@gmail.com."],
      },
    ],
  },
} as const satisfies Record<string, PolicyDocument>;

export type PolicyKind = keyof typeof POLICIES;
