# Testing

Backend tests talk to the configured PostgreSQL database, create their own rows, and delete those rows when they finish. Frontend tests run in jsdom and mock network calls.

## Backend

From `backend`:

```bash
.venv/Scripts/python.exe -m pytest -q --tb=short
```

| Area | Where it is covered |
| --- | --- |
| Registration, login, refresh, password reset | `tests/test_auth.py` |
| Role authorization | `tests/test_auth.py` and journey tests |
| Services, packages, products, courses, enquiries, quotes, orders | `tests/test_catalog_api.py` |
| Visitor enquiry, custom quote, cart checkout, course purchase, admin product, admin course, enquiry management | `tests/test_journeys.py` |
| Password hashing, access-token type, public URL and storage-key checks | `tests/test_security.py` |

Auth and public form routes are rate limited. The test suite resets those limits around each test so a full run can sign in more than once a minute.

## Frontend

From `frontend`:

```bash
npm test
```

| Area | Where it is covered |
| --- | --- |
| Protected routes and admin access | `src/routes/guards.test.tsx`, `src/routes/access.test.tsx` |
| Authentication state and sign-in redirect | `src/context/AuthContext.test.tsx`, `src/components/forms/LoginForm.test.tsx` |
| Contact, enquiry, and quote forms | `src/services/forms.test.ts`, `src/components/enquiries/ServiceEnquiryForm.test.tsx`, `src/pages/CustomQuotePage.test.tsx` |
| Product and course listing | `src/components/shop/ProductGrid.test.tsx`, `src/components/academy/CourseGrid.test.tsx` |
| Cart and checkout entry | `src/context/CartContext.test.tsx`, `src/pages/CartPage.test.tsx` |
| Responsive navigation | `src/components/layout/Navbar.test.tsx` |

## Journeys

1. Visitor opens a published service and submits an enquiry. Staff can read it. Anonymous listing is rejected.
2. Visitor submits a custom quote. Staff can read it.
3. Customer adds a priced shop product and checks out. Another customer cannot open that order.
4. Student buys a published course. Study stays closed until payment is recorded, then the account gains the student role and an active enrollment.
5. Staff signs in and publishes a product. A customer cannot create one.
6. Staff publishes a course. Draft courses stay off the public list.
7. Staff assigns and updates an enquiry. A customer cannot.

Do not skip or delete a failing test to make the suite pass. Fix the application or the assertion.
