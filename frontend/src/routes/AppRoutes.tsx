import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { ADMIN_RESOURCES } from "@/admin/resources";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AcademyLayout } from "@/layouts/AcademyLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { RequireAdmin, RequireAuth } from "@/routes/guards";
import {
  AboutPage,
  AcademyCoursePage,
  AcademyCoursesPage,
  AcademyDashboardPage,
  AcademyLearnPage,
  AcademyLoginPage,
  AcademyPage,
  AcademyRegisterPage,
  AccountPage,
  AdminEnquiriesPage,
  AdminPage,
  AdminQuotesPage,
  AdminResourcePage,
  CartPage,
  CheckoutPage,
  ContactPage,
  CustomQuotePage,
  HomePage,
  LearnPage,
  LoginPage,
  NotFoundPage,
  OrderSuccessPage,
  OrdersPage,
  PaymentPage,
  PolicyPage,
  ProductDetailPage,
  RegisterPage,
  ShopCategoryPage,
  ShopPage,
  ShopProductPage,
  SolutionDetailPage,
  SolutionsPage,
  TechnologyPage,
  TechnologyTrackPage,
} from "@/routes/lazyPages";

function QuoteRedirect() {
  const location = useLocation();
  return <Navigate to={`/custom-quote${location.search}`} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="solutions" element={<SolutionsPage />} />
        <Route path="solutions/:slug" element={<SolutionDetailPage />} />
        <Route path="technology" element={<TechnologyPage />} />
        <Route path="technology/products/:slug" element={<ProductDetailPage />} />
        <Route path="technology/:slug" element={<TechnologyTrackPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="shop/category/:slug" element={<ShopCategoryPage />} />
        <Route path="shop/product/:slug" element={<ShopProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="academy" element={<AcademyPage />} />
        <Route path="academy/courses" element={<AcademyCoursesPage />} />
        <Route path="academy/course/:slug" element={<AcademyCoursePage />} />
        <Route path="academy/login" element={<AcademyLoginPage />} />
        <Route path="academy/register" element={<AcademyRegisterPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<PolicyPage kind="privacy" />} />
        <Route path="terms" element={<PolicyPage kind="terms" />} />
        <Route path="refunds" element={<PolicyPage kind="refund" />} />
        <Route path="data-security" element={<PolicyPage kind="security" />} />
        <Route path="custom-quote" element={<CustomQuotePage />} />
        <Route path="quote" element={<QuoteRedirect />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route path="account" element={<AccountPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="order-success" element={<OrderSuccessPage />} />
        <Route path="learn" element={<LearnPage />} />
      </Route>
      <Route
        element={
          <RequireAuth loginPath="/academy/login">
            <AcademyLayout />
          </RequireAuth>
        }
      >
        <Route path="academy/dashboard" element={<AcademyDashboardPage />} />
        <Route path="academy/course/:courseId/learn" element={<AcademyLearnPage />} />
      </Route>
      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route path="admin" element={<AdminPage />} />
        <Route path="admin/services" element={<AdminResourcePage key="services" resource={ADMIN_RESOURCES.services} />} />
        <Route path="admin/packages" element={<AdminResourcePage key="packages" resource={ADMIN_RESOURCES.packages} />} />
        <Route path="admin/products" element={<AdminResourcePage key="products" resource={ADMIN_RESOURCES.products} />} />
        <Route path="admin/categories" element={<AdminResourcePage key="categories" resource={ADMIN_RESOURCES.categories} />} />
        <Route path="admin/courses" element={<AdminResourcePage key="courses" resource={ADMIN_RESOURCES.courses} />} />
        <Route path="admin/orders" element={<AdminResourcePage key="orders" resource={ADMIN_RESOURCES.orders} />} />
        <Route path="admin/customers" element={<AdminResourcePage key="customers" resource={ADMIN_RESOURCES.customers} />} />
        <Route path="admin/students" element={<AdminResourcePage key="students" resource={ADMIN_RESOURCES.students} />} />
        <Route path="admin/enquiries" element={<AdminEnquiriesPage />} />
        <Route path="admin/quotes" element={<AdminQuotesPage />} />
        <Route path="admin/testimonials" element={<AdminResourcePage key="testimonials" resource={ADMIN_RESOURCES.testimonials} />} />
        <Route path="admin/homepage" element={<AdminResourcePage key="homepage" resource={ADMIN_RESOURCES.homepage} />} />
        <Route path="admin/banners" element={<AdminResourcePage key="banners" resource={ADMIN_RESOURCES.banners} />} />
        <Route path="admin/blog" element={<AdminResourcePage key="blog" resource={ADMIN_RESOURCES.blog} />} />
        <Route path="admin/seo" element={<AdminResourcePage key="seo" resource={ADMIN_RESOURCES.seo} />} />
        <Route path="admin/social" element={<AdminResourcePage key="social" resource={ADMIN_RESOURCES.social} />} />
        <Route path="admin/settings" element={<AdminResourcePage key="settings" resource={ADMIN_RESOURCES.settings} />} />
        <Route path="admin/activity" element={<AdminResourcePage key="activity" resource={ADMIN_RESOURCES.activity} />} />
      </Route>
    </Routes>
  );
}
