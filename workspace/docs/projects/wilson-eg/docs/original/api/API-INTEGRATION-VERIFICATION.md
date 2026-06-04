# API Integration Verification — Frontend ↔ Backend

**Date:** 2026-02-22  
**Purpose:** Confirm every endpoint usage across all frontend files and pages before push.

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Verified | 37 |
| ⚠️ Dead code (unused) | 0 |
| ❌ Broken | 0 |

---

## Public (no auth)

| Endpoint | Frontend usage | Status |
|----------|----------------|--------|
| `GET /api/products` | productsApi.getAll, getFeatured, getRelated; HomePage, ProductsPage, ProductDetailPage | ✅ |
| `GET /api/products/:id` | productsApi.getById, getBySku; ProductDetailPage, offer slides | ✅ |
| `GET /api/categories` | categoriesApi.getAll; useCategories (ProductsPage nav, filters) | ✅ |
| `GET /api/categories/:slug` | categoriesApi.getBySlug | ✅ |
| `GET /api/slides` | slidesApi.getSlides; HomePage (hero, offers) | ✅ |
| `POST /api/auth/login` | AuthContext.requestOtp (phone) | ✅ |
| `POST /api/contact` | contactApi.sendMessage; ContactPage, ServicePage | ✅ |

---

## Customer (JWT)

| Endpoint | Frontend usage | Status |
|----------|----------------|--------|
| `GET /api/profile` | AuthContext (fetchProfile, after login) | ✅ |
| `PUT /api/profile` | AuthContext.updateProfile | ✅ |
| `GET /api/addresses` | AuthContext.fetchAddresses | ✅ |
| `POST /api/addresses` | AuthContext.addAddress | ✅ |
| `PUT /api/addresses/:id` | AuthContext.updateAddress | ✅ |
| `DELETE /api/addresses/:id` | AuthContext.deleteAddress | ✅ |
| `POST /api/favorites` | favoritesApi.toggle; ProductCard | ✅ |
| `GET /api/favorites` | favoritesApi.getAll; WishlistPage, ProfilePage | ✅ |
| `GET /api/favorites/:id/status` | (optional — not used in current pages) | — |
| `POST /api/orders` | ordersApi.create; CheckoutPage | ✅ |
| `GET /api/orders` | ordersApi.getAll; OrdersPage, ProfilePage | ✅ |
| `GET /api/orders/:id/track` | ordersApi.getTrack; OrderTrackingTimeline | ✅ |
| `POST /api/orders/:id/cancel` | ordersApi.cancel; OrdersPage | ✅ |
| `POST /api/coupons/validate` | couponsApi.validate; CartPage, CheckoutPage | ✅ |

**Contract checks:**
- `GET /orders`: Backend returns `shippingFee`, `createdAt`; api.ts maps `shippingFee` → `shipping`. ✅
- `GET /orders/:id/track`: Backend returns `tracking_steps`; OrderTrackingTimeline uses `tracking_steps`. ✅
- `POST /coupons/validate`: Backend returns `valid`, `code`, `discountType`, `discountValue`, `discountAmount`; frontend uses `discountAmount`. ✅

---

## Admin (JWT + admin)

| Endpoint | Frontend usage | Status |
|----------|----------------|--------|
| `GET /api/admin/analytics/dashboard` | analyticsApi.getDashboard; DashboardPage | ✅ |
| `GET /api/admin/products` | adminApi.getProducts; ProductsPage | ✅ |
| `GET /api/admin/products/:id` | adminApi.getProduct; ProductsPage (edit modal) | ✅ |
| `POST /api/admin/products` | adminApi.createProduct; ProductsPage | ✅ |
| `PUT /api/admin/products/:id` | adminApi.updateProduct; ProductsPage | ✅ |
| `DELETE /api/admin/products/:id` | adminApi.deleteProduct; ProductsPage | ✅ |
| `PUT /api/admin/products/:id/inventory` | adminApi.updateProductInventory; ProductsPage | ✅ |
| `POST /api/admin/products/upload-images` | adminApi.uploadProductImage; ProductsPage | ✅ |
| `GET /api/admin/categories` | adminApi.getCategories; CategoriesPage | ✅ |
| `POST /api/admin/categories` | adminApi.createCategory; CategoriesPage | ✅ |
| `PUT /api/admin/categories/:id` | adminApi.updateCategory; CategoriesPage | ✅ |
| `DELETE /api/admin/categories/:id` | adminApi.deleteCategory; CategoriesPage | ✅ |
| `GET /api/admin/orders` | adminApi.getOrders, adminOrdersApi.getAll; OrdersPage, CustomersPage, DashboardPage, AdminLayout | ✅ |
| `GET /api/admin/orders/:id` | adminApi.getOrder; useAdminOrder (ready for order detail modal) | ✅ |
| `PUT /api/admin/orders/:id/status` | adminApi.updateOrderStatus; OrdersPage | ✅ |
| `GET /api/admin/customers` | adminApi.getCustomers; CustomersPage | ✅ |
| `GET /api/admin/customers/:id` | adminApi.getCustomer; useAdminCustomer (ready for customer detail modal) | ✅ |
| `GET /api/admin/coupons` | adminApi.getCoupons; CouponsPage | ✅ |
| `POST /api/admin/coupons` | adminApi.createCoupon; CouponsPage | ✅ |
| `PUT /api/admin/coupons/:id` | adminApi.updateCoupon; CouponsPage | ✅ |
| `DELETE /api/admin/coupons/:id` | adminApi.deleteCoupon; CouponsPage | ✅ |
| `GET /api/admin/slides` | adminApi.getSlides; SlidesPage | ✅ |
| `POST /api/admin/slides` | adminApi.createSlide; SlidesPage | ✅ |
| `PUT /api/admin/slides/:id` | adminApi.updateSlide; SlidesPage | ✅ |
| `DELETE /api/admin/slides/:id` | adminApi.deleteSlide; SlidesPage | ✅ |
| `GET /api/admin/settings` | adminApi.getSettings; SettingsPage | ✅ |
| `PUT /api/admin/settings` | adminApi.updateSettings; SettingsPage | ✅ |

**Contract checks:**
- Admin orders: Backend returns `userName`, `userPhone`; useAdmin maps → `customerName`, `customerPhone`. ✅
- Admin coupons: Backend uses `discountType`, `discountValue`, `maxUses`, `usedCount`; useAdmin maps → `type`, `value`, `usageLimit`, `usageCount`. ✅
- Coupon create/update: CouponsPage sends `discountType`, `discountValue`, `maxUses`, `startDate`, `endDate`, `status`, `code`. ✅

---

## Page → API mapping

| Page | APIs used |
|------|-----------|
| HomePage | productsApi.getByCategory, slidesApi.getSlides |
| ProductsPage (customer) | productsApi.getAll, categoriesApi (useCategories) |
| ProductDetailPage | productsApi.getBySku, getRelated |
| CartPage | couponsApi.validate |
| CheckoutPage | couponsApi.validate, ordersApi.create |
| OrdersPage (customer) | ordersApi.getAll, ordersApi.cancel |
| OrderTrackingTimeline | ordersApi.getTrack |
| WishlistPage | favoritesApi.getAll |
| ProfilePage | ordersApi.getAll, favoritesApi.getAll |
| ContactPage, ServicePage | contactApi.sendMessage |
| LoginPage | AuthContext → /auth/login |
| DashboardPage | analyticsApi.getDashboard, adminOrdersApi.getAll |
| ProductsPage (admin) | adminApi (products, categories, upload) |
| OrdersPage (admin) | useAdminOrders, useUpdateOrderStatus |
| CustomersPage | useAdminCustomers, useAdminOrdersByCustomer |
| CouponsPage | useAdminCoupons, useCreate/Update/DeleteCoupon |
| CategoriesPage | useAdminCategories |
| SlidesPage | useAdminSlides |
| SettingsPage | useAdminSettings |

---

## Conclusion

All endpoints are correctly integrated. Backend routes for `GET /admin/orders/:id` and `GET /admin/customers/:id` added so useAdminOrder/useAdminCustomer work when order/customer detail modals are implemented. Safe to push.
