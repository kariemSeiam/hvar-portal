import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useLanguage } from './contexts/LanguageContext'
import Layout from './components/layout/Layout'
import AdminLayout from './components/admin/AdminLayout'
import { Spinner } from './components/ui/Spinner'
import { SeoHead } from './components/layout/SeoHead'
import { usePageView } from './hooks/usePageView'

// Lazy-loaded pages (code splitting)
const HomePage = lazy(() => import('./pages/customer/HomePage'))
const ProductsPage = lazy(() => import('./pages/customer/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/customer/ProductDetailPage'))
const CartPage = lazy(() => import('./pages/customer/CartPage'))
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'))
const AboutPage = lazy(() => import('./pages/customer/AboutPage'))
const ServicePage = lazy(() => import('./pages/customer/ServicePage'))
const ContactPage = lazy(() => import('./pages/customer/ContactPage'))
const LoginPage = lazy(() => import('./pages/customer/LoginPage'))
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage'))
const OrdersPage = lazy(() => import('./pages/customer/OrdersPage'))
const WishlistPage = lazy(() => import('./pages/customer/WishlistPage'))
const NotFoundPage = lazy(() => import('./pages/customer/NotFoundPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const AdminProductsPage = lazy(() => import('./pages/admin/ProductsPage'))
const AdminCategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'))
const AdminOrdersPage = lazy(() => import('./pages/admin/OrdersPage'))
const AdminCustomersPage = lazy(() => import('./pages/admin/CustomersPage'))
const AdminCouponsPage = lazy(() => import('./pages/admin/CouponsPage'))
const AdminSlidesPage = lazy(() => import('./pages/admin/SlidesPage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/SettingsPage'))
const AdminPortalPage = lazy(() => import('./pages/admin/AdminPortalPage'))

const PageFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <Spinner size="lg" />
  </div>
)

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  const { dir } = useLanguage()
  usePageView()

  return (
    <div dir={dir} className="min-h-screen bg-background bg-grid-dots doodle-app-bg text-foreground">
      <ScrollToTop />
      <SeoHead />
      <Suspense fallback={<PageFallback />}>
        <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:sku" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="service" element={<ServicePage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="account" element={<ProfilePage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin Portal Gate - Creative entry for admins after login */}
        <Route path="/admin-portal" element={<AdminPortalPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="slides" element={<AdminSlidesPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
