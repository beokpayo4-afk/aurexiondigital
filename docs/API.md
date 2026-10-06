# Aurexion API

Interactive reference: `/docs` (Swagger) and `/redoc`. Every route below is also described there.

Base path: `/api`.

## Response shape

List routes return:

```json
{ "items": [], "page": 1, "page_size": 20, "total": 0 }
```

`page` starts at 1. `page_size` is from 1 to 50.

Errors return:

```json
{ "detail": "Not found", "code": "not_found" }
```

Validation errors use `code` `http_422` and an `errors` array of `{ "loc", "msg" }`.

| Status | code |
| --- | --- |
| 401 | unauthorized |
| 403 | forbidden |
| 404 | not_found |
| 409 | conflict |
| other | http_<status> |

## Authentication

Protected routes use `Authorization: Bearer <access_token>` from `POST /api/auth/login` or `POST /api/auth/register`.

Roles are `ADMIN`, `STAFF`, `CUSTOMER`, and `STUDENT`. A route that allows admin or staff accepts either role.

## Visibility

Public catalog reads return records where `is_published` is true and `deleted_at` is empty.

Admin and staff can read unpublished drafts. Deleted records are hidden from every caller, including staff.

`is_published` as a list filter is applied only for admin and staff. A public request that sends `is_published=false` still receives published records only.

New services, packages, products, categories, and courses are unpublished unless the create body sets `is_published` to true.

Deletes are soft deletes. A category delete returns 409 when a live child category or catalog record still uses it.

A public package is returned only when the package and its parent service are both published. Deleting a service also soft-deletes its packages.

## Shared query parameters

| Parameter | Meaning |
| --- | --- |
| page | Page number, starting at 1 |
| page_size | Items per page, maximum 50 |
| q | Case-insensitive search. `%` and `_` are matched literally |
| sort | Field name. Prefix with `-` for descending. Unknown fields return 422 |

## Services

| Method | Path | Access |
| --- | --- | --- |
| GET | /api/services | Public. Staff also see drafts |
| GET | /api/services/{slug} | Public. Staff also see drafts |
| POST | /api/services | Admin, staff |
| PUT | /api/services/{id} | Admin, staff |
| DELETE | /api/services/{id} | Admin, staff |

Filters: `business_area`, `category_id`, `is_published` (staff).

Sort: `name`, `slug`, `created_at`, `sort_order`. Default `sort_order`.

Search covers name, summary, and slug.

`business_area` is one of `marketing-advertising`, `technology-digital-products`, `education-academy`, `business-solutions`.

A service response includes visible packages. Public responses include published packages only.

## Service packages

| Method | Path | Access |
| --- | --- | --- |
| GET | /api/service-packages | Public, published parent service required |
| GET | /api/service-packages/{id} | Public, published parent service required |
| POST | /api/service-packages | Admin, staff |
| PUT | /api/service-packages/{id} | Admin, staff |
| DELETE | /api/service-packages/{id} | Admin, staff |

Filters: `service_id`, `billing_period` (`one_time`, `monthly`, `yearly`, `custom`), `is_published` (staff).

Sort: `name`, `slug`, `created_at`, `sort_order`, `price_amount`. Default `sort_order`.

Slug uniqueness is per service. Price is stored on the package. Currency defaults to `INR`.

## Products

| Method | Path | Access |
| --- | --- | --- |
| GET | /api/products | Public. Staff also see drafts |
| GET | /api/products/{slug} | Public. Staff also see drafts |
| POST | /api/products | Admin, staff |
| PUT | /api/products/{id} | Admin, staff |
| DELETE | /api/products/{id} | Admin, staff |

Filters: `business_area`, `category_id`, `product_type` (`software`, `saas`, `digital`, `ecommerce`), `listing_channel` (`technology`, `shop`, `both`), `is_published` (staff).

Sort: `name`, `slug`, `created_at`, `sort_order`. Default `sort_order`.

Search covers name, summary, slug, and SKU.

The product body includes non-deleted prices, product-level images, and features. Public responses include active prices only. `demo_url` is the preview link when one is set. A private download key is never included in a product response.

Shop lists accept `for_shop=true`, `min_price`, `max_price`, and sort `price`. Cart routes are `/api/cart`. Checkout is `POST /api/checkout`. Payment settings come from `PAYMENT_PROVIDER`, `PAYMENT_KEY_ID`, `PAYMENT_KEY_SECRET`, and `PAYMENT_WEBHOOK_SECRET`. `GET /api/payments/config` returns only the publishable key. A paid digital download is `GET /api/orders/{order_id}/items/{item_id}/download` and does not return the storage path.

## Categories

Categories are stored separately for services, products, and courses. `kind` is required on list and create: `service`, `product`, or `course`.

| Method | Path | Access |
| --- | --- | --- |
| GET | /api/categories?kind= | Public. Staff also see drafts |
| POST | /api/categories | Admin, staff |
| PUT | /api/categories/{id} | Admin, staff |
| DELETE | /api/categories/{id} | Admin, staff |

Filters: `parent_id`, `is_published` (staff).

Sort: `name`, `slug`, `created_at`, `sort_order`. Default `sort_order`.

Update and delete find the category by id across the three tables.

## Courses

| Method | Path | Access |
| --- | --- | --- |
| GET | /api/courses | Public. Staff also see drafts |
| GET | /api/courses/{slug} | Public. Staff also see drafts |
| POST | /api/courses | Admin, staff |
| PUT | /api/courses/{id} | Admin, staff |
| DELETE | /api/courses/{id} | Admin, staff |

Filters: `business_area`, `category_id`, `level`, `is_published` (staff).

Sort: `title`, `slug`, `created_at`, `sort_order`. Default `sort_order`.

Course responses contain the course record, including thumbnail, learning outcomes, and whether a certificate is enabled. Lesson content is not included.

Academy study routes:

| Method | Path | Access |
| --- | --- | --- |
| GET | /api/academy/courses/{slug} | Public outline. Preview lesson text only. Resource locations are omitted |
| POST | /api/academy/checkout | Authenticated. Creates a pending course order and a pending enrollment |
| GET | /api/academy/me | Authenticated enrollments and progress |
| GET | /api/academy/study/{course_id} | Active or completed enrollment. This is the only route that returns lesson bodies |
| POST | /api/academy/lessons/{lesson_id}/complete | Active or completed enrollment |
| GET | /api/academy/resources/{resource_id}/download | Active or completed enrollment. Streams a private file and does not return its path |

A paid course order activates the enrollment and grants the student role. Until payment succeeds, study returns 403.

## Enquiries

| Method | Path | Access |
| --- | --- | --- |
| POST | /api/enquiries | Public. Optional bearer token links the account |
| GET | /api/enquiries | Admin, staff |
| GET | /api/enquiries/{id} | Admin, staff |
| PUT | /api/enquiries/{id} | Admin, staff |

Create body: `name`, `email`, `message`, optional `phone`, `company_name`, and `service_id`.

Update body may set `status`, `assigned_to_user_id`, and `notes`. The assignee must be an active admin or staff account. `notes` are internal.

Status values: `new`, `contacted`, `in_progress`, `proposal_sent`, `converted`, `closed`. New submissions start as `new`.

Filters: `status`, `service_id`. Search matches name, email, company, and message. Sort: `created_at`, `name`, `email`. Default `-created_at`.

`service_id` is optional. Public callers can only attach a published service.

`GET /api/admin/staff` lists active admin and staff accounts for assignment. Admin or staff only.

## Quote requests

| Method | Path | Access |
| --- | --- | --- |
| POST | /api/quote-requests | Public. Optional bearer token links the account |
| GET | /api/quote-requests | Admin, staff |
| GET | /api/quote-requests/{id} | Admin, staff |
| PUT | /api/quote-requests/{id} | Admin, staff |

Create body: `name`, `email`, `requirements`, optional `phone`, `organization`, `product_service`, `target_location`, `target_audience`, `estimated_budget`, `channels`, `business_area`, and `service_id`.

`channels` is a list of campaign names: Meta Ads, Instagram, YouTube, Google Ads, Influencer Marketing, Billboard, Bus Advertising, Flex/Boards, Event/Hall Advertising, Content Creation, Lead Generation, SEO, Social Media Marketing, Creative Services. Unknown names are rejected. `estimated_budget` is stored as submitted text.

Update body may set `status`, `response_message`, and `response_amount`. A response records `responded_at` and `responded_by_user_id`.

Status values: `new`, `reviewing`, `quoted`, `accepted`, `declined`, `closed`.

Filters: `status`, `business_area`. Sort: `created_at`, `name`, `email`. Default `-created_at`.

## Contact

| Method | Path | Access |
| --- | --- | --- |
| POST | /api/contact | Public |
| GET | /api/contact | Admin, staff |

Create body: `name`, `email`, `message`, and either `subject` or `promote`. Optional fields: `phone`, `company_name`, `interest` (`Marketing`, `Technology`, `Education`, `Other`), `channel` (`Online`, `Offline`, `Both`), `budget`, `target_location`, and `source_path`. `budget` is stored as submitted text. When `subject` is omitted, it is taken from `promote`.

Filters: `status`. Sort: `created_at`, `name`, `email`. Default `-created_at`.

## Orders

| Method | Path | Access |
| --- | --- | --- |
| GET | /api/orders | Authenticated |
| GET | /api/orders/{id} | Authenticated |

Customers and students see only their own orders. Admin and staff see all orders and may filter with `user_id`.

An order that the caller cannot see returns 404.

Filters: `status` (`pending`, `paid`, `cancelled`, `fulfilled`, `refunded`). Search matches `order_number`.

Sort: `placed_at`, `total`, `order_number`. Default `-placed_at`.

The detail includes line items and payment amount, currency, and status.

## Admin and content

These routes require an admin or staff bearer token. A missing token is 401. A customer or student token is 403.

| Method | Path | Access |
| --- | --- | --- |
| GET | /api/admin/summary | Admin, staff |
| GET | /api/admin/customers | Admin, staff |
| GET | /api/admin/students | Admin, staff |
| GET | /api/admin/activity | Admin, staff |
| GET, POST | /api/testimonials | List is public for published rows. Create requires admin or staff. |
| PUT, DELETE | /api/testimonials/{id} | Admin, staff |
| GET | /api/homepage | Public. Published banners and featured products or courses. |
| GET, POST | /api/banners | List is public for published rows. Create requires admin or staff. |
| PUT, DELETE | /api/banners/{id} | Admin, staff |
| GET, POST | /api/homepage-sections | Same visibility as banners. Featured ids are stored without copying names or prices. |
| PUT, DELETE | /api/homepage-sections/{id} | Admin, staff |
| GET, POST | /api/blog-posts | Published posts are public. Writes require admin or staff. |
| PUT, DELETE | /api/blog-posts/{id} | Admin, staff |
| GET | /api/seo-settings/lookup?path= | Public, one path. A saved title and description replace the page defaults for that path, including dynamic pages. |
| GET, POST | /api/seo-settings | Admin, staff |
| PUT, DELETE | /api/seo-settings/{id} | Admin, staff |
| GET | /robots.txt | Public. Allows the marketing site and disallows account, checkout, and admin paths. |
| GET | /sitemap.xml | Public. Static pages plus published services, products, shop categories, and courses. |
| GET, POST | /api/social-links | Published links are public. Writes require admin or staff. |
| PUT, DELETE | /api/social-links/{id} | Admin, staff |
| GET, POST, PUT, DELETE | /api/settings | Admin, staff |

Dashboard revenue is the sum of paid and fulfilled order totals when those orders use one currency. Activity logs record successful admin and staff changes to catalog and content routes.
