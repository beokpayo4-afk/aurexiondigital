export type AdminOption = { value: string; label: string };

export type AdminField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "select" | "lines" | "uuid-list";
  required?: boolean;
  createOnly?: boolean;
  options?: AdminOption[];
  help?: string;
};

export type AdminColumn = {
  key: string;
  label: string;
  format?: "bool" | "active";
};

export type AdminFilter = {
  param: string;
  label: string;
  options: AdminOption[];
  defaultValue?: string;
};

export type AdminResource = {
  key: string;
  title: string;
  description: string;
  path: string;
  columns: AdminColumn[];
  fields: AdminField[];
  sorts: AdminOption[];
  defaultSort: string;
  filters?: AdminFilter[];
  publishFilter?: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

const AREAS: AdminOption[] = [
  { value: "marketing-advertising", label: "Marketing and advertising" },
  { value: "technology-digital-products", label: "Technology and digital products" },
  { value: "education-academy", label: "Education and academy" },
  { value: "business-solutions", label: "Business solutions" },
];

const PUBLISHED: AdminColumn = { key: "is_published", label: "Status", format: "bool" };

export const ADMIN_RESOURCES: Record<string, AdminResource> = {
  services: {
    key: "services",
    title: "Services",
    description: "Create, update, publish, or remove services.",
    path: "/services",
    columns: [
      { key: "name", label: "Name" },
      { key: "business_area", label: "Area" },
      { key: "slug", label: "Slug" },
      PUBLISHED,
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text" },
      { name: "business_area", label: "Business area", type: "select", required: true, options: AREAS },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "sort_order", label: "Sort order", type: "number", required: true },
      { name: "is_published", label: "Published", type: "checkbox" },
    ],
    sorts: [
      { value: "sort_order", label: "Sort order" },
      { value: "name", label: "Name" },
      { value: "-created_at", label: "Newest" },
    ],
    defaultSort: "sort_order",
    publishFilter: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  packages: {
    key: "packages",
    title: "Service Packages",
    description: "Packages belong to a service. Leave price empty when a price has not been set.",
    path: "/service-packages",
    columns: [
      { key: "name", label: "Name" },
      { key: "price_amount", label: "Price" },
      { key: "currency", label: "Currency" },
      PUBLISHED,
    ],
    fields: [
      { name: "service_id", label: "Service id", type: "text", required: true, help: "Copy the id from the Services table." },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text" },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "price_amount", label: "Price", type: "number", help: "Leave blank when no price is published." },
      { name: "currency", label: "Currency", type: "text", required: true },
      {
        name: "billing_period",
        label: "Billing period",
        type: "select",
        options: [
          { value: "one_time", label: "One time" },
          { value: "monthly", label: "Monthly" },
          { value: "yearly", label: "Yearly" },
          { value: "custom", label: "Custom" },
        ],
      },
      { name: "sort_order", label: "Sort order", type: "number", required: true },
      { name: "is_published", label: "Published", type: "checkbox" },
    ],
    sorts: [
      { value: "sort_order", label: "Sort order" },
      { value: "name", label: "Name" },
      { value: "price_amount", label: "Price" },
      { value: "-created_at", label: "Newest" },
    ],
    defaultSort: "sort_order",
    publishFilter: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  products: {
    key: "products",
    title: "Products",
    description: "Shop and technology products. Price is stored on the product price record, not in this form.",
    path: "/products",
    columns: [
      { key: "name", label: "Name" },
      { key: "product_type", label: "Type" },
      { key: "listing_channel", label: "Channel" },
      PUBLISHED,
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text" },
      { name: "business_area", label: "Business area", type: "select", required: true, options: AREAS },
      {
        name: "product_type",
        label: "Product type",
        type: "select",
        required: true,
        options: [
          { value: "software", label: "Software" },
          { value: "saas", label: "SaaS" },
          { value: "digital", label: "Digital" },
          { value: "ecommerce", label: "Ecommerce" },
        ],
      },
      {
        name: "listing_channel",
        label: "Listing channel",
        type: "select",
        required: true,
        options: [
          { value: "shop", label: "Shop" },
          { value: "technology", label: "Technology" },
          { value: "both", label: "Shop and technology" },
        ],
      },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "sku", label: "SKU", type: "text" },
      { name: "sort_order", label: "Sort order", type: "number", required: true },
      { name: "is_published", label: "Published", type: "checkbox" },
    ],
    sorts: [
      { value: "sort_order", label: "Sort order" },
      { value: "name", label: "Name" },
      { value: "-created_at", label: "Newest" },
    ],
    defaultSort: "sort_order",
    publishFilter: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  categories: {
    key: "categories",
    title: "Categories",
    description: "Service, product, and course categories are stored separately.",
    path: "/categories",
    columns: [
      { key: "name", label: "Name" },
      { key: "kind", label: "Kind" },
      { key: "slug", label: "Slug" },
      PUBLISHED,
    ],
    fields: [
      {
        name: "kind",
        label: "Kind",
        type: "select",
        required: true,
        createOnly: true,
        options: [
          { value: "service", label: "Service" },
          { value: "product", label: "Product" },
          { value: "course", label: "Course" },
        ],
      },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "sort_order", label: "Sort order", type: "number", required: true },
      { name: "is_published", label: "Published", type: "checkbox" },
    ],
    sorts: [
      { value: "sort_order", label: "Sort order" },
      { value: "name", label: "Name" },
      { value: "-created_at", label: "Newest" },
    ],
    defaultSort: "sort_order",
    filters: [
      {
        param: "kind",
        label: "Kind",
        defaultValue: "service",
        options: [
          { value: "service", label: "Service" },
          { value: "product", label: "Product" },
          { value: "course", label: "Course" },
        ],
      },
    ],
    publishFilter: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  courses: {
    key: "courses",
    title: "Courses",
    description: "Academy courses. Enter a price only when that price is the published amount.",
    path: "/courses",
    columns: [
      { key: "title", label: "Title" },
      { key: "price_amount", label: "Price" },
      { key: "currency", label: "Currency" },
      PUBLISHED,
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text" },
      { name: "business_area", label: "Business area", type: "select", required: true, options: AREAS },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "level", label: "Level", type: "text" },
      { name: "duration_label", label: "Duration", type: "text" },
      { name: "thumbnail_url", label: "Thumbnail URL", type: "text" },
      { name: "learning_outcomes", label: "Learning outcomes", type: "lines", help: "One outcome per line." },
      { name: "price_amount", label: "Price", type: "number" },
      { name: "currency", label: "Currency", type: "text", required: true },
      { name: "certificate_enabled", label: "Certificate enabled", type: "checkbox" },
      { name: "sort_order", label: "Sort order", type: "number", required: true },
      { name: "is_published", label: "Published", type: "checkbox" },
    ],
    sorts: [
      { value: "sort_order", label: "Sort order" },
      { value: "title", label: "Title" },
      { value: "-created_at", label: "Newest" },
    ],
    defaultSort: "sort_order",
    publishFilter: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  orders: {
    key: "orders",
    title: "Orders",
    description: "Orders placed by customers. Payment status changes when the payment provider confirms them.",
    path: "/orders",
    columns: [
      { key: "order_number", label: "Order" },
      { key: "status", label: "Status" },
      { key: "total", label: "Total" },
      { key: "currency", label: "Currency" },
      { key: "placed_at", label: "Placed" },
    ],
    fields: [],
    sorts: [
      { value: "-placed_at", label: "Newest" },
      { value: "placed_at", label: "Oldest" },
      { value: "-total", label: "Total" },
      { value: "order_number", label: "Order number" },
    ],
    defaultSort: "-placed_at",
    filters: [
      {
        param: "status",
        label: "Status",
        options: [
          { value: "pending", label: "Pending" },
          { value: "paid", label: "Paid" },
          { value: "fulfilled", label: "Fulfilled" },
          { value: "cancelled", label: "Cancelled" },
          { value: "refunded", label: "Refunded" },
        ],
      },
    ],
    canCreate: false,
    canEdit: false,
    canDelete: false,
  },
  customers: {
    key: "customers",
    title: "Customers",
    description: "Accounts that hold the customer role.",
    path: "/admin/customers",
    columns: [
      { key: "full_name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "is_active", label: "Account", format: "active" },
      { key: "created_at", label: "Joined" },
    ],
    fields: [],
    sorts: [
      { value: "full_name", label: "Name" },
      { value: "email", label: "Email" },
      { value: "-created_at", label: "Newest" },
    ],
    defaultSort: "full_name",
    canCreate: false,
    canEdit: false,
    canDelete: false,
  },
  students: {
    key: "students",
    title: "Students",
    description: "Accounts that hold the student role.",
    path: "/admin/students",
    columns: [
      { key: "full_name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "is_active", label: "Account", format: "active" },
      { key: "created_at", label: "Joined" },
    ],
    fields: [],
    sorts: [
      { value: "full_name", label: "Name" },
      { value: "email", label: "Email" },
      { value: "-created_at", label: "Newest" },
    ],
    defaultSort: "full_name",
    canCreate: false,
    canEdit: false,
    canDelete: false,
  },
  testimonials: {
    key: "testimonials",
    title: "Testimonials",
    description: "Publish a testimonial only when the wording was supplied.",
    path: "/testimonials",
    columns: [
      { key: "author_name", label: "Author" },
      { key: "author_role", label: "Role" },
      PUBLISHED,
    ],
    fields: [
      { name: "author_name", label: "Author name", type: "text", required: true },
      { name: "author_role", label: "Author role", type: "text" },
      { name: "body", label: "Testimonial", type: "textarea", required: true },
      { name: "rating", label: "Rating", type: "number", help: "1 to 5, or leave blank." },
      { name: "business_area", label: "Business area", type: "select", options: AREAS },
      { name: "sort_order", label: "Sort order", type: "number", required: true },
      { name: "is_published", label: "Published", type: "checkbox" },
    ],
    sorts: [
      { value: "sort_order", label: "Sort order" },
      { value: "author_name", label: "Author" },
      { value: "-created_at", label: "Newest" },
    ],
    defaultSort: "sort_order",
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  homepage: {
    key: "homepage",
    title: "Homepage",
    description: "Sections can feature existing products and courses by id. Names and prices stay on those records.",
    path: "/homepage-sections",
    columns: [
      { key: "section_key", label: "Key" },
      { key: "title", label: "Title" },
      PUBLISHED,
    ],
    fields: [
      { name: "section_key", label: "Section key", type: "text", required: true, createOnly: true },
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "featured_product_ids", label: "Featured products", type: "uuid-list", help: "One product id per line." },
      { name: "featured_course_ids", label: "Featured courses", type: "uuid-list", help: "One course id per line." },
      { name: "sort_order", label: "Sort order", type: "number", required: true },
      { name: "is_published", label: "Published", type: "checkbox" },
    ],
    sorts: [
      { value: "sort_order", label: "Sort order" },
      { value: "section_key", label: "Key" },
      { value: "-created_at", label: "Newest" },
    ],
    defaultSort: "sort_order",
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  banners: {
    key: "banners",
    title: "Banners",
    description: "A published banner appears on the homepage.",
    path: "/banners",
    columns: [
      { key: "title", label: "Title" },
      { key: "image_url", label: "Image" },
      PUBLISHED,
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "subtitle", label: "Subtitle", type: "text" },
      { name: "image_url", label: "Image URL", type: "text", required: true },
      { name: "link_url", label: "Link URL", type: "text" },
      { name: "sort_order", label: "Sort order", type: "number", required: true },
      { name: "is_published", label: "Published", type: "checkbox" },
    ],
    sorts: [
      { value: "sort_order", label: "Sort order" },
      { value: "title", label: "Title" },
      { value: "-created_at", label: "Newest" },
    ],
    defaultSort: "sort_order",
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  blog: {
    key: "blog",
    title: "Blog",
    description: "Posts stay unpublished until you publish them.",
    path: "/blog-posts",
    columns: [
      { key: "title", label: "Title" },
      { key: "slug", label: "Slug" },
      PUBLISHED,
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text" },
      { name: "excerpt", label: "Excerpt", type: "textarea" },
      { name: "body", label: "Body", type: "textarea", required: true },
      { name: "is_published", label: "Published", type: "checkbox" },
    ],
    sorts: [
      { value: "-created_at", label: "Newest" },
      { value: "title", label: "Title" },
      { value: "slug", label: "Slug" },
    ],
    defaultSort: "-created_at",
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  seo: {
    key: "seo",
    title: "SEO",
    description: "Title and description for a path. A saved record replaces the page defaults, including a dynamic path such as /shop/product/your-slug or /academy/course/your-slug.",
    path: "/seo-settings",
    columns: [
      { key: "path", label: "Path" },
      { key: "meta_title", label: "Title" },
      { key: "canonical_path", label: "Canonical" },
    ],
    fields: [
      { name: "path", label: "Path", type: "text", required: true, createOnly: true, help: "Starts with /. Use the full path for a product, course, or service page." },
      { name: "meta_title", label: "Title", type: "text", help: "Browser title for this path. Include the brand if it should appear in the title." },
      { name: "meta_description", label: "Meta description", type: "textarea" },
      { name: "og_image_url", label: "Open Graph image", type: "text" },
      { name: "canonical_path", label: "Canonical URL path", type: "text", help: "Starts with /." },
      { name: "robots", label: "Robots", type: "text" },
    ],
    sorts: [
      { value: "path", label: "Path" },
      { value: "-created_at", label: "Newest" },
    ],
    defaultSort: "path",
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  social: {
    key: "social",
    title: "Social Links",
    description: "Published links appear in the site footer.",
    path: "/social-links",
    columns: [
      { key: "platform", label: "Platform" },
      { key: "url", label: "URL" },
      PUBLISHED,
    ],
    fields: [
      { name: "platform", label: "Platform", type: "text", required: true },
      { name: "url", label: "URL", type: "text", required: true, help: "Starts with http:// or https://." },
      { name: "sort_order", label: "Sort order", type: "number", required: true },
      { name: "is_published", label: "Published", type: "checkbox" },
    ],
    sorts: [
      { value: "sort_order", label: "Sort order" },
      { value: "platform", label: "Platform" },
      { value: "-created_at", label: "Newest" },
    ],
    defaultSort: "sort_order",
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  settings: {
    key: "settings",
    title: "Settings",
    description: "Key and value pairs for site configuration. Do not store payment secrets here.",
    path: "/settings",
    columns: [
      { key: "key", label: "Key" },
      { key: "value", label: "Value" },
    ],
    fields: [
      { name: "key", label: "Key", type: "text", required: true, createOnly: true, help: "Lowercase letters, numbers, and underscores." },
      { name: "value", label: "Value", type: "textarea" },
    ],
    sorts: [
      { value: "key", label: "Key" },
      { value: "-created_at", label: "Newest" },
    ],
    defaultSort: "key",
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  activity: {
    key: "activity",
    title: "Activity Logs",
    description: "Changes made by admin and staff accounts.",
    path: "/admin/activity",
    columns: [
      { key: "created_at", label: "When" },
      { key: "action", label: "Action" },
      { key: "entity_type", label: "Record" },
      { key: "actor_email", label: "Actor" },
    ],
    fields: [],
    sorts: [
      { value: "-created_at", label: "Newest" },
      { value: "action", label: "Action" },
      { value: "entity_type", label: "Record" },
    ],
    defaultSort: "-created_at",
    canCreate: false,
    canEdit: false,
    canDelete: false,
  },
};

export const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/services", label: "Services" },
  { to: "/admin/packages", label: "Service Packages" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/courses", label: "Courses" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/students", label: "Students" },
  { to: "/admin/enquiries", label: "Enquiries" },
  { to: "/admin/quotes", label: "Quote Requests" },
  { to: "/admin/testimonials", label: "Testimonials" },
  { to: "/admin/homepage", label: "Homepage" },
  { to: "/admin/banners", label: "Banners" },
  { to: "/admin/blog", label: "Blog" },
  { to: "/admin/seo", label: "SEO" },
  { to: "/admin/social", label: "Social Links" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/activity", label: "Activity Logs" },
] as const;
