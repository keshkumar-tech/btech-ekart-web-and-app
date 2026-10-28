import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { RequireAdmin, RequireAuth } from "@/components/ProtectedRoute";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";

// Store pages
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Wishlist from "@/pages/Wishlist";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import MyOrders from "@/pages/MyOrders";
import OrderDetail from "@/pages/OrderDetail";
import MyLibrary from "@/pages/MyLibrary";
import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import BlogList from "@/pages/BlogList";
import BlogDetail from "@/pages/BlogDetail";
import StaticPage from "@/pages/StaticPage";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";

// Admin pages
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminCustomerDetail from "@/pages/admin/AdminCustomerDetail";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminOrderDetail from "@/pages/admin/AdminOrderDetail";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminTaxonomy from "@/pages/admin/AdminTaxonomy";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminBanners from "@/pages/admin/AdminBanners";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminBlog from "@/pages/admin/AdminBlog";
import AdminSettings from "@/pages/admin/AdminSettings";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  const fetchMe = useAuth((s) => s.fetchMe);
  const initTheme = useTheme((s) => s.init);

  useEffect(() => {
    initTheme();
    fetchMe();
  }, [fetchMe, initTheme]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public store */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="blog" element={<BlogList />} />
          <Route path="blog/:slug" element={<BlogDetail />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="terms" element={<StaticPage page="terms" />} />
          <Route path="privacy" element={<StaticPage page="privacy" />} />
          <Route path="refund-policy" element={<StaticPage page="refund" />} />
          <Route path="disclaimer" element={<StaticPage page="disclaimer" />} />

          {/* Auth-required store pages */}
          <Route element={<RequireAuth />}>
            <Route path="checkout" element={<Checkout />} />
            <Route
              path="order-success/:orderNumber"
              element={<OrderSuccess />}
            />
            <Route path="orders" element={<MyOrders />} />
            <Route path="orders/:orderNumber" element={<OrderDetail />} />
            <Route path="library" element={<MyLibrary />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Route>

        {/* Auth (no navbar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin dashboard */}
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:userId" element={<AdminCustomerDetail />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:orderNumber" element={<AdminOrderDetail />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="taxonomy" element={<AdminTaxonomy />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
