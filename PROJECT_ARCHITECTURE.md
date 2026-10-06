# Aurexion Digital — Project Architecture

Status: architecture only. This document does not implement the platform.

Company: **Aurexion Digital Private Limited**

Approved positioning line:

**Technology • Marketing • Advertising • Education • Business Solutions**

## 1. Source boundaries

Two inputs were available for this plan.

| Source | What it is | What it is allowed to define |
| --- | --- | --- |
| This project request | Platform scope, tech stack, website areas, dashboards, and the list of records administrators must manage | Information architecture, modules, roles, and data model |
| Form No. INC-33 e-MOA, 11 pages, dated on the form 03/07/2026, file `DOC-20260827-WA0006.pdf` | Memorandum of Association for a company limited by shares. Registered office is situated in the State of Madhya Pradesh | The legally stated business objects, used below as the allowed service vocabulary |

A separate “Aurexion website development brief” with page copy, named packages, prices, course titles, product catalog, testimonials, social URLs, or contact details was not present in the workspace and was not attached as readable text. Those items stay empty until that brief is supplied.

Rules that follow from that gap:

- Service names on the public site must stay inside the e-MOA objects in section 2. Administrators may publish, group, price, and describe those activities. They may not be given a starter catalog of invented offers.
- Clause 3(a)(9) of the e-MOA is an incidental-objects clause. It is not a public service line.
- Clause 3(b) (ancillary powers: capital, property, borrowing, investments, and similar) is company-law machinery. It is not website content.
- Subscriber addresses, identification numbers, shareholding, and the witness block on the e-MOA are out of scope for the website and for this document.
- A logo file exists locally as `AUREXION LOGO.jpeg`. It is not copied into the repository by this step. Add it during the frontend foundation phase after it is confirmed as the site mark.

## 2. Requirements analysis

### 2.1 What this platform is

The site is a database-driven business platform with a public website, authenticated customer and student areas, and an admin dashboard. Public pages read published records from the API. Administrators change services, prices, courses, products, enquiries, quotes, orders, testimonials, homepage sections, SEO, and social links without a code deploy.

### 2.2 Approved business areas

These four areas are the top-level grouping for services, courses, and products. They are the only business-area rows to seed.

| Slug | Name | Public surfaces |
| --- | --- | --- |
| `marketing-advertising` | Marketing & Advertising | Home, Solutions |
| `technology-digital-products` | Technology & Digital Products | Home, Technology, Shop |
| `education-academy` | Education / Aurexion Academy | Home, Academy, Student Dashboard |
| `business-solutions` | Business Solutions | Home, Solutions, Custom Quote |

### 2.3 Allowed activity vocabulary

Grouped from e-MOA clause 3(a), objects 1–8. Wording is kept to the activities named there.

**Marketing & Advertising** (objects 4 and 8)

- Digital marketing
- Social media marketing
- Influencer marketing
- Search engine optimization (SEO)
- Online advertisement services
- Branding services
- Media buying
- Performance marketing
- Affiliate marketing
- Public relations
- Content creation
- Lead generation
- Marketing consultancy for individuals, businesses, startups, and organizations
- Media production
- Advertisement film production
- Video editing services
- Graphic designing services
- Computer animation services
- Identity branding services
- Digital content management systems

**Technology & Digital Products** (objects 1 and 6)

- E-commerce, online trading, online retailing, and wholesale trading
- Selling of software as a service (SaaS)
- Digital product distribution
- Online subscriptions
- Automation tools
- Business management software
- Productivity tools
- Analytics tools
- Legally permissible online commercial and direct retail activities
- Import, export, distribution, licensing, franchising, reselling, agency representation, and direct trading of software products, electronic components, digital services, technology solutions, and enterprise support systems

**Education / Aurexion Academy** (object 3)

- Training
- Vocational education
- Corporate workshops
- Seminars
- Webinars
- Online coaching
- Skill development programs
- Digital learning platforms
- Mentorship programs
- Educational advisory in technology, marketing, business management, and entrepreneurship

**Business Solutions** (objects 2, 5, and 7)

- Corporate consultancy: business consultancy, marketing consultancy, management consultancy, operational consultancy, startup consultancy, digital transformation consultancy, technology implementation consultancy, customer support services, and non-financial business advisory services
- Trade facilitation services
- Digital commerce infrastructure support services
- Technical support services
- Operational coordination services
- Other legally permissible business support activities in accordance with applicable laws
- Outsourced manpower solutions
- Recruitment backend support
- Freelance vendor coordination
- Project management services
- Vendor workflow management systems
- Workforce support services

No package names, price points, course titles, or product SKUs are defined. The data model stores them. Seed data does not.

### 2.4 Website areas

| Area | Role |
| --- | --- |
| Home | Published homepage sections, the four business areas, and featured published records |
| Solutions | Published services and their packages, filterable by business area |
| Technology | Software, SaaS, and digital products, plus services in the technology area |
| Shop | Purchasable e-commerce products, and digital products the admin places in the shop |
| Academy | Published courses and course outlines. Lesson bodies stay behind enrollment |
| About Us | One managed page. Initial facts are limited to the legal name, the positioning line, and the registered-office state |
| Contact | General enquiry form |
| Custom Quote | Quote request tied to a business area and, when selected, a service |
| Authentication | Register, login, logout, current user |
| Customer Dashboard | Own profile, orders, and quote requests |
| Student Dashboard | Own enrollments, lesson content, and progress |
| Admin Dashboard | The management list in section 2.5 |

Contact and Custom Quote are different records. An enquiry is a message. A quote request asks for a commercial response against a service.

### 2.5 Records administrators must be able to manage

Services, service packages, prices, courses, software products, SaaS products, digital products, e-commerce products, categories, product images, course content, enquiries, quote requests, customers, students, orders, testimonials, homepage sections, SEO information, and social media links.

Customers and students are users with roles. They are not a second person database.

### 2.6 Roles

| Role code | Can access |
| --- | --- |
| `customer` | Customer dashboard, own cart, own orders, own quote requests |
| `student` | Student dashboard, enrolled course content, own progress |
| `admin` | Admin dashboard and all management APIs |

A user may hold `customer` and `student` together. Registration grants `customer`. `student` is granted when an enrollment becomes active, and may also be granted by an admin. `admin` is assigned only by an existing admin. The first admin is created by a one-off seed command, not by public registration.

### 2.7 Stack (fixed)

Frontend: React, Vite, TypeScript, Tailwind CSS, React Router, Axios, Framer Motion, React Hook Form, Zod.

Backend: Python, FastAPI, SQLAlchemy, Alembic, Pydantic, JWT.

Database: PostgreSQL.

Style: REST under `/api/v1`, layered backend packages (API, services, repositories, models), React route modules, content served from the database, role checks on the API.

### 2.8 Decisions held open

These are required for a later phase and are not chosen here:

- Payment provider. Orders can be created and moved through statuses. Taking payment is a later adapter.
- Email and SMS provider. Password reset and notifications wait for that choice.
- File storage beyond local disk in development. The media module hides storage behind an adapter.
- Street address, phone, email, and social URLs. Admin-managed settings, initially empty.
- Display timezone. Store timestamps in UTC.

Recommended technical defaults, stated so implementation does not drift:

- UUID primary keys.
- Money as `NUMERIC(12, 2)` plus a `CHAR(3)` currency code. Default currency `INR`, because the e-MOA states capital in rupees. No prices are seeded.
- Passwords hashed with Argon2id.
- Short-lived access JWT. Refresh token stored only as a hash, sent as an HttpOnly cookie.
- Slugs unique per entity type. Public routes use slugs. Admin routes use ids.

## 3. Folder architecture

The running repository uses a layered layout. Business capabilities from later phases are added inside these layers (for example `services/catalog.py` and `repositories/catalog.py`). They are not separate top-level packages.

```text
aurexion-digital/
├── PROJECT_ARCHITECTURE.md
├── README.md
├── docker-compose.yml
├── .gitignore
├── docs/
├── frontend/
│   ├── package.json
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── common/
│       │   ├── layout/
│       │   ├── home/
│       │   ├── solutions/
│       │   ├── technology/
│       │   ├── shop/
│       │   ├── academy/
│       │   ├── forms/
│       │   └── admin/
│       ├── pages/
│       ├── layouts/
│       ├── routes/
│       ├── hooks/
│       ├── services/
│       ├── api/
│       ├── context/
│       ├── types/
│       ├── utils/
│       ├── constants/
│       └── App.tsx
└── backend/
    ├── app/
    │   ├── api/
    │   ├── core/
    │   ├── models/
    │   ├── schemas/
    │   ├── services/
    │   ├── repositories/
    │   ├── middleware/
    │   ├── utils/
    │   └── main.py
    ├── alembic/
    ├── tests/
    ├── requirements.txt
    └── .env.example
```

API routes stay thin. Validation lives in Pydantic schemas on the backend and Zod schemas on the frontend. Business rules will live in `backend/app/services` and `frontend/src/services`. SQLAlchemy access will live in repositories. Password hashing and JWT helpers live in `backend/app/core/security.py`.

`docker-compose.yml` runs PostgreSQL for local development. It is not a production hosting choice.

## 4. Database entity plan

Convention for every table unless a column is listed as absent: `id UUID` primary key, `created_at`, `updated_at` in UTC. Catalog rows that an admin can archive also have `deleted_at` nullable. Public queries require `deleted_at IS NULL` and `is_published = true`.

The schema that is migrated is `backend/app/models`, revision `2441eddce1b9`. It adds permissions on roles, product variants and prices, certificates, separate lead tables, and content tables for banners, FAQs, and blog posts. Prices for products live only in `product_prices`. Package and course prices stay on those rows.

### 4.1 Identity and access

**users**

| Column | Notes |
| --- | --- |
| email | Unique, used as login |
| password_hash | Never returned by the API |
| full_name | |
| phone | Nullable |
| is_active | |
| email_verified_at | Nullable. Verification email waits on the email provider |

**roles**

Seed only: `admin`, `customer`, `student`. Columns: `code` unique, `name`.

**user_roles**

`user_id`, `role_id`. Primary key on the pair.

**refresh_tokens**

`user_id`, `token_hash`, `expires_at`, `revoked_at`.

### 4.2 Catalog

**business_areas**

Seed the four rows in section 2.2. Columns: `slug` unique, `name`, `description` (empty until copy exists), `sort_order`, `is_published`.

**categories**

Admin-defined. No category seed. Columns: `parent_id` nullable self-FK, `business_area_id` nullable FK, `kind` (`service` | `product` | `course`), `slug`, `name`, `description`, `sort_order`, `is_published`. Unique `(kind, slug)`.

**services**

| Column | Notes |
| --- | --- |
| business_area_id | Required |
| category_id | Nullable |
| slug | Unique |
| name | Must match the vocabulary in section 2.3 when first created from that list |
| summary, description | Admin-authored. Empty is valid |
| sort_order, is_published | |

**service_packages**

Belongs to one service. Columns: `service_id`, `slug` unique per service, `name`, `summary`, `price_amount` nullable, `currency`, `billing_period` (`one_time` | `monthly` | `yearly` | `custom`), `sort_order`, `is_published`. A null price means “price on quote”, which is the correct state until prices are supplied.

**package_features**

`package_id`, `label`, `sort_order`. Feature lines are admin content. None are seeded.

### 4.3 Products and images

**products**

One table. `product_type` distinguishes the four kinds the admin must manage.

| Column | Notes |
| --- | --- |
| category_id | Nullable |
| business_area_id | Required. Technology products use `technology-digital-products` |
| slug | Unique |
| name, summary, description | |
| product_type | `software` \| `saas` \| `digital` \| `ecommerce` |
| listing_channel | `technology` \| `shop` \| `both` |
| price_amount | Nullable until set |
| compare_at_amount | Nullable. Unused until a real compare price exists |
| currency | |
| sku | Nullable |
| billing_period | Nullable. Used by `saas` |
| is_downloadable | For `software` and `digital` |
| track_stock | Boolean |
| stock_quantity | Nullable. Required only when `track_stock` is true |
| sort_order, is_published | |

Initial listing rule, overridable per product:

| product_type | listing_channel |
| --- | --- |
| software, saas | technology |
| ecommerce | shop |
| digital | both |

**product_images**

`product_id`, `media_asset_id`, `alt_text`, `sort_order`, `is_primary`. One primary image per product.

### 4.4 Media

**media_assets**

`storage_key`, `file_name`, `mime_type`, `byte_size`, `alt_text`, `uploaded_by` FK users. The storage adapter writes the bytes. The database stores the key and metadata. Allowed uploads: images for products and SEO, and the file types later allowed for course materials. Executables are rejected.

### 4.5 Academy

**courses**

`category_id` nullable, `business_area_id` (education area), `slug` unique, `title`, `summary`, `description`, `price_amount` nullable, `currency`, `level` nullable, `duration_label` nullable, `sort_order`, `is_published`. No course titles are seeded.

**course_modules**

`course_id`, `title`, `sort_order`.

**course_lessons**

`module_id`, `title`, `content_type` (`text` | `video_url` | `file`), `body` nullable, `media_asset_id` nullable, `external_url` nullable, `sort_order`, `is_preview`. Preview lessons are readable without enrollment. Everything else requires an active enrollment.

**enrollments**

`user_id`, `course_id`, unique together, `status` (`pending` | `active` | `completed` | `cancelled`), `source` (`manual` | `order`), `order_item_id` nullable, `enrolled_at`.

**lesson_progress**

`enrollment_id`, `lesson_id`, unique together, `completed_at`.

### 4.6 Commerce

**carts**

`user_id` nullable, `guest_token` nullable, `updated_at`. A cart belongs to a user or a guest token, not both.

**cart_items**

`cart_id`, `product_id` nullable, `package_id` nullable, `course_id` nullable, `quantity`, `unit_price_snapshot`. Exactly one target id is set. A package or course can be added only when it has a price. Priced-on-quote items go through Custom Quote, not the cart.

**orders**

`order_number` unique, `user_id`, `status` (`pending` | `paid` | `cancelled` | `fulfilled` | `refunded`), `currency`, `subtotal`, `total`, `placed_at`. Guest checkout is not in scope. Placing an order requires a customer account.

**order_items**

`order_id`, `item_type` (`product` | `package` | `course`), the matching nullable FK, `name_snapshot`, `unit_price`, `quantity`, `line_total`. Snapshots keep history if the catalog price later changes.

**payments**

`order_id`, `amount`, `status` (`pending` | `succeeded` | `failed`), `provider` nullable, `provider_reference` nullable, `paid_at` nullable. `provider` stays null until a provider is chosen. Admins may mark an order paid when payment is taken outside the site. That transition is audited.

When an order item of type `course` sits on an order that becomes `paid`, the commerce module asks the courses module to activate the enrollment and the users module to grant `student`.

### 4.7 Enquiries and quotes

**enquiries**

`name`, `email`, `phone` nullable, `subject`, `message`, `status` (`new` | `in_progress` | `closed`), `source_path`. Public create. Admin updates status. No account required.

**quote_requests**

`user_id` nullable, `name`, `email`, `phone` nullable, `business_area_id` nullable, `service_id` nullable, `requirements`, `status` (`new` | `reviewing` | `quoted` | `accepted` | `declined` | `closed`). Logged-in customers see their own rows on the customer dashboard. Guests can submit and later see the request only if the email matches their account after login. Matching is exact email, case-insensitive.

**quote_responses**

`quote_request_id`, `admin_user_id`, `message`, `amount` nullable, `currency`, `valid_until` nullable. Creating a response sets the request status to `quoted`.

### 4.8 Content, SEO, settings

**homepage_sections**

`section_key` unique, `title`, `subtitle`, `body`, `sort_order`, `is_published`, `config_json`.

Allowed keys, seeded unpublished with empty copy:

| section_key | Purpose |
| --- | --- |
| hero | First screen |
| business_areas | The four areas |
| featured_services | Selected published services |
| featured_technology | Selected technology listings |
| featured_shop | Selected shop listings |
| academy | Selected published courses |
| testimonials | Published testimonials |
| quote_cta | Link into Custom Quote |

`config_json` may hold ordered ids of featured records. It may not hold a parallel copy of prices or names. The page resolves ids through the catalog APIs.

**pages**

Managed prose pages. Seed one row: slug `about`, title `About Us`, unpublished body limited to the legal name, the positioning line, and “Registered office: State of Madhya Pradesh”. Further About copy waits for the brief.

**testimonials**

`author_name`, `author_role` nullable, `body`, `rating` nullable 1–5, `business_area_id` nullable, `sort_order`, `is_published`. None seeded.

**seo_entries**

`path` unique, `entity_type` nullable, `entity_id` nullable, `meta_title`, `meta_description`, `og_image_media_id` nullable, `canonical_path` nullable, `robots` nullable. Entity pages (service, product, course) use one SEO row each. Standalone paths (`/`, `/contact`, `/about`, `/quote`) have their own rows, initially empty.

**social_links**

`platform`, `url`, `sort_order`, `is_published`. No rows seeded.

**site_settings**

Key-value for public contact fields the admin later fills: `contact_email`, `contact_phone`, `contact_address`. Values start null. The API returns only non-null public keys.

**audit_logs**

`actor_user_id` nullable, `action`, `entity_type`, `entity_id`, `metadata_json`. Written when an admin changes order status, role assignment, quote response, or publication state.

### 4.9 Relationships

```text
users ──< user_roles >── roles
users ──< refresh_tokens
users ──< enrollments >── courses ──< course_modules ──< course_lessons
users ──< orders ──< order_items >── products | service_packages | courses
users ──< carts ──< cart_items
users ──< quote_requests ──< quote_responses
business_areas ──< services ──< service_packages ──< package_features
business_areas ──< products ──< product_images >── media_assets
categories ──< services | products | courses
```

Orders, quote responses, and enrollments reference catalog rows they must keep even after a product is unpublished. Unpublish hides a record. Delete is a soft delete and is refused when an order item, enrollment, or quote response still points at it.

## 5. API module plan

Base path: `/api/v1`. JSON. Errors: `{ "detail": string, "code": string }`. Lists: `?page=&page_size=` with `page_size` capped at 50, response `{ "items": [], "page": 1, "page_size": 20, "total": 0 }`.

Auth header: `Authorization: Bearer <access>`. Refresh cookie is sent only to the auth refresh route.

| Module | Depends on | Public | Customer or student | Admin |
| --- | --- | --- | --- | --- |
| auth | users | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | `GET /auth/me` | — |
| users | auth | — | `PATCH /me` (name, phone) | `GET /admin/users`, `POST /admin/users/{id}/roles`, `PATCH /admin/users/{id}` (active flag) |
| catalog | content SEO hook, media | `GET /business-areas`, `GET /categories`, `GET /services`, `GET /services/{slug}`, `GET /services/{slug}/packages` | — | CRUD `/admin/business-areas`, `/admin/categories`, `/admin/services`, `/admin/packages`, `/admin/packages/{id}/features` |
| products | catalog, media | `GET /products?listing_channel=&product_type=&category=`, `GET /products/{slug}` | — | CRUD `/admin/products`, image attach and reorder |
| media | auth | — | — | `POST /admin/media`, `GET /admin/media`, `DELETE /admin/media/{id}` |
| courses | users, media, commerce (inbound) | `GET /courses`, `GET /courses/{slug}` (outline, preview lessons only) | `GET /me/enrollments`, `GET /me/courses/{slug}`, `POST /me/lessons/{id}/complete` | CRUD `/admin/courses`, modules, lessons; `POST /admin/enrollments` |
| commerce | products, catalog, courses, users | — | `GET/POST /me/cart`, `PATCH/DELETE /me/cart/items/{id}`, `POST /me/orders`, `GET /me/orders`, `GET /me/orders/{id}` | `GET /admin/orders`, `PATCH /admin/orders/{id}` (status) |
| quotes | catalog, users | `POST /quote-requests` | `GET /me/quote-requests` | `GET /admin/quote-requests`, `PATCH` status, `POST /admin/quote-requests/{id}/responses` |
| enquiries | — | `POST /enquiries` | — | `GET /admin/enquiries`, `PATCH /admin/enquiries/{id}` |
| content | catalog, products, courses, media | `GET /homepage`, `GET /pages/{slug}`, `GET /testimonials`, `GET /seo?path=` | — | CRUD `/admin/homepage-sections`, `/admin/pages`, `/admin/testimonials`, `/admin/seo` |
| settings | — | `GET /settings/public` | — | `GET/PUT /admin/settings`, CRUD `/admin/social-links` |

Write schemas use Pydantic. The frontend repeats the public contract in Zod. FastAPI’s OpenAPI document is the contract to check those schemas against.

Publication rule: a package, product, course, testimonial, page, or homepage section with `is_published = false` is absent from public GETs and present in admin GETs.

Customer routes require the `customer` role. Student lesson content requires `student` plus an active enrollment, except `is_preview` lessons. Admin routes require `admin`.

## 6. Frontend route plan

React Router. Data comes from the API through the Axios client. Forms use React Hook Form and Zod. Framer Motion is limited to page and section transitions.

| Path | Audience | Reads |
| --- | --- | --- |
| `/` | Public | `GET /homepage`, then featured records by id |
| `/solutions` | Public | Services, optional `?area=` |
| `/solutions/:slug` | Public | Service and packages |
| `/technology` | Public | Products with `listing_channel` technology or both; technology-area services |
| `/technology/:slug` | Public | One technology product |
| `/shop` | Public | Products with `listing_channel` shop or both |
| `/shop/:slug` | Public | One shop product. Add to cart when a price exists |
| `/academy` | Public | Courses |
| `/academy/:slug` | Public | Course outline and preview lessons |
| `/about` | Public | Page slug `about` |
| `/contact` | Public | Public settings. Posts an enquiry |
| `/quote` | Public | Business areas and services. Posts a quote request |
| `/login`, `/register` | Guest | Auth module |
| `/account` | Customer | `GET /auth/me` |
| `/account/orders`, `/account/orders/:id` | Customer | Own orders |
| `/account/quotes` | Customer | Own quote requests |
| `/learn` | Student | Own enrollments |
| `/learn/courses/:slug` | Student | Enrolled course or preview |
| `/learn/courses/:slug/lessons/:lessonId` | Student | Lesson. Hidden unless preview or enrolled |

Guards:

- Guest-only routes send an authenticated user to `/account`.
- Customer routes send anonymous users to `/login?next=`.
- Student routes do the same, then show an empty state when the user has no active enrollment.
- Admin routes live under `/admin` and are refused without the `admin` role.

Navigation labels, in this order: Home, Solutions, Technology, Shop, Academy, About Us, Contact. Custom Quote is a button in the header, not a sixth peer in the text nav. Login and account replace each other based on the session.

## 7. Admin route plan

All routes require `admin`. The shell is a separate layout from the public site.

| Path | Manages |
| --- | --- |
| `/admin` | Counts of new enquiries, open quotes, pending orders, unpublished drafts |
| `/admin/services`, `/admin/services/:id` | Services |
| `/admin/packages`, `/admin/packages/:id` | Packages and feature lines, including price and billing period |
| `/admin/products`, `/admin/products/:id` | All four product types, listing channel, price, stock, images |
| `/admin/categories` | Categories for services, products, and courses |
| `/admin/media` | Uploads |
| `/admin/courses`, `/admin/courses/:id` | Course fields, modules, lessons |
| `/admin/enrollments` | Manual enrollments and status |
| `/admin/enquiries`, `/admin/enquiries/:id` | Enquiry status |
| `/admin/quotes`, `/admin/quotes/:id` | Quote status and responses |
| `/admin/customers` | Users who hold `customer` |
| `/admin/students` | Users who hold `student` |
| `/admin/orders`, `/admin/orders/:id` | Order status |
| `/admin/testimonials` | Testimonials and publication |
| `/admin/homepage` | Homepage sections and featured ids |
| `/admin/pages/:slug` | About, and later managed pages |
| `/admin/seo` | SEO rows |
| `/admin/settings` | Contact settings and social links |
| `/admin/users` | Active flag and role assignment |

Customers and students screens are filters on users. They are not separate create-forms that bypass registration, except that an admin may create a user and assign roles when onboarding someone directly.

## 8. How the modules depend on each other

```text
auth ──> users ──> roles

media ─────────────────────────────> products, courses, content (SEO images)

catalog (areas, categories, services, packages)
   ├──> products          (area + category)
   ├──> courses           (area + category)
   ├──> quotes            (area + service on a request)
   ├──> commerce          (priced packages as line items)
   └──> content           (featured service ids)

products ──> commerce (cart and order items)
courses  ──> commerce (priced courses as line items)
commerce ──> courses  (paid course line activates enrollment)
commerce ──> users    (active enrollment grants student)

content ──> catalog, products, courses, testimonials
settings     independent, read by Contact and the public footer

enquiries    independent
quotes ──> catalog, users
audit_logs   written by users, commerce, quotes, content publication
```

Rules that keep those edges one-directional:

- The catalog does not import commerce. A package does not know who bought it.
- Courses do not import the HTTP cart. Commerce calls a course service function, `ensure_enrollment(user, course, order_item)`, after payment.
- Content does not copy product prices into `config_json`.
- Public page components call their feature API. They do not import the admin feature.
- Role checks live in `api/deps.py`. Modules do not reimplement JWT parsing.

## 9. Delivery sequence

Build in this order. Each phase is deployable on its own. Do not start a later phase by stubbing fake services, prices, or courses.

| Phase | Outcome | Done when |
| --- | --- | --- |
| 0 | This document | Reviewed against the website brief once that brief is available |
| 1 | Backend app, PostgreSQL, Alembic, users, roles, JWT, first admin seed, frontend shell and route guards | Register, login, logout, and `/auth/me` work. Admin seed can open `/admin` |
| 2 | Catalog, products, media, courses schema, content, settings, SEO | Admin can create a service, package, product, and course. Public GETs return only published rows |
| 3 | Public pages bound to those APIs | Home, Solutions, Technology, Shop, Academy, About, Contact render empty states honestly when nothing is published |
| 4 | Enquiries and quote requests | Contact and Custom Quote persist. Admin can answer a quote. Customer dashboard lists own quotes |
| 5 | Course content and student access | Preview lessons are public. Other lessons require an active enrollment. Progress is saved |
| 6 | Cart and orders, without a payment provider | A priced product, package, or course can be ordered into `pending`. Admin can mark `paid`. A paid course order activates enrollment |
| 7 | Remaining admin screens and audit log | Every entity in section 2.5 has a working admin screen |
| 8 | Motion, SEO head tags, and responsive pass | Public routes set titles from `seo_entries` when those rows exist |

Phase 3 is allowed to ship with empty catalogs. Empty states should say that content will be published by the company. They should not display sample services.

## 10. Seed data allowed in phase 1–2

- Three roles.
- Four business areas, published, with the names in section 2.2 and empty descriptions.
- Eight homepage section keys, unpublished, empty copy.
- One `about` page, unpublished, limited to the facts in section 4.8.
- One admin user from environment variables supplied at seed time, not committed.

Not seeded: services, packages, features, prices, categories, products, images, courses, lessons, testimonials, social links, contact details, SEO sentences, enquiries, quotes, or orders.

## 11. Configuration names

`.env.example` lists names only.

Backend: `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_TTL_MINUTES`, `JWT_REFRESH_TTL_DAYS`, `CORS_ORIGINS`, `MEDIA_ROOT`, `FIRST_ADMIN_EMAIL`, `FIRST_ADMIN_PASSWORD`.

Frontend: `VITE_API_BASE_URL`.

Secrets stay out of git. `FIRST_ADMIN_PASSWORD` is read once by the seed command and is not stored in the frontend.

## 12. What the next implementation step is

Phase 1 only: repository skeleton, PostgreSQL, Alembic, auth, roles, and the empty route shell with guards. Catalog screens and public page design wait until phase 1 is in place and, if the website brief arrives, until section 2.3 and the empty-seed rules are checked against it.
