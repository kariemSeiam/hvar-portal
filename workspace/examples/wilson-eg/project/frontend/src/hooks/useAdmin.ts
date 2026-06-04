import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { request, ApiError } from '@/services/api'

// Types
interface DashboardAnalytics {
  totalSales: number
  totalOrders: number
  totalCustomers: number
  pendingOrders: number
  recentOrders: Order[]
  topProducts: Product[]
  salesByPeriod: { date: string; amount: number }[]
}

interface Order {
  id: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
}

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
}

/** Minimal product shape for legacy/dashboard use */
interface Product {
  id: string
  nameAr: string
  nameEn: string
  descriptionAr?: string
  descriptionEn?: string
  features?: string[]
  featuresAr?: string[]
  featuresEn?: string[]
  price: number
  stock: number
  category: string
  status: 'active' | 'inactive'
  imageUrl: string
  basePrice?: number
}

/** Admin variant size (backend shape) */
export interface AdminVariantSize {
  size: string
  quantity: number
  inStock: boolean
}

/** Admin variant (backend shape) */
export interface AdminVariant {
  id: string
  colorName: string
  colorCode: string
  images: string[]
  sizes: AdminVariantSize[]
}

/** Offer slide ref on product (admin list) */
export interface AdminOfferSlideRef {
  id: string
  title: string | null
  status: string
  position: number
}

/** Low/out of stock item (admin list) */
export interface AdminStockAlert {
  variantId: string
  colorName: string
  size: string
  quantity?: number
}

/** Full admin product — same shape as GET /api/admin/products item */
export interface AdminProduct {
  id: string
  name: string
  nameAr: string | null
  nameEn: string | null
  code: string
  description?: string | null
  descriptionAr?: string | null
  descriptionEn?: string | null
  category: string
  basePrice: number
  discountPrice?: number | null
  tag?: string | null
  tagColor?: string | null
  rating?: number
  ratingCount?: number
  status: string
  features?: string[]
  featuresAr?: string[]
  featuresEn?: string[]
  variants: AdminVariant[]
  views?: number
  salesCount?: number
  createdAt?: string | null
  updatedAt?: string | null
  productNumber?: number
  totalStock?: number
  lowStockSizes?: AdminStockAlert[]
  outOfStockSizes?: Omit<AdminStockAlert, 'quantity'>[]
  orderCount?: number
  offerSlides?: AdminOfferSlideRef[]
}

/** Summary from GET /api/admin/products */
export interface AdminProductsSummary {
  totalProducts: number
  statusCounts: { active: number; inactive: number; outOfStock: number }
  totalOrders: number
  lowStockCount: number
  activeOfferSlides: number
}

/** Backend admin products list response (full, no drops) */
export interface AdminProductsResponse {
  products: AdminProduct[]
  total: number
  pages: number
  currentPage: number
  summary: AdminProductsSummary
}

/** Create product payload (backend expects these keys) */
export interface AdminProductCreateInput {
  nameAr?: string
  nameEn?: string
  name?: string
  descriptionAr?: string
  descriptionEn?: string
  description?: string
  category: string
  basePrice: number
  discountPrice?: number | null
  tag?: string | null
  tagColor?: string | null
  status?: string
  featuresAr?: string[]
  featuresEn?: string[]
  features?: string[]
  variants: Array<{
    colorName: string
    colorCode: string
    sizes: Array<{ size: string; quantity: number }>
    images?: string[]
  }>
}

/** Update product payload (same as create + variant id for existing) */
export interface AdminProductUpdateInput extends AdminProductCreateInput {
  variants: Array<{
    id?: string
    colorName: string
    colorCode: string
    sizes: Array<{ size: string; quantity: number }>
    images?: string[]
  }>
}

/** Backend admin orders list returns paginated object */
export interface AdminOrdersResponse {
  orders: Order[]
  total: number
  pages: number
  currentPage: number
}

/** Backend admin customers list returns paginated object */
export interface AdminCustomersResponse {
  customers: Customer[]
  total: number
  pages: number
  currentPage: number
}

/** Backend admin coupons list returns paginated object */
export interface AdminCouponsResponse {
  coupons: Coupon[]
  total: number
  pages: number
  currentPage: number
}

interface Customer {
  id: string
  name: string
  phone: string
  ordersCount: number
  totalSpent: number
  joinedAt: string
  addresses?: Array<{ governorate?: string; district?: string; details?: string }>
}

export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  usageLimit: number
  usageCount: number
  status: 'active' | 'expired'
  expiresAt: string
  /** Backend create/update uses these names */
  discountType?: 'percentage' | 'fixed'
  discountValue?: number
  maxUses?: number
  startDate?: string
  endDate?: string
}

/** Admin category from GET /api/admin/categories */
export interface Category {
  id: string
  slug: string
  nameAr: string
  nameEn: string
  sortOrder: number
  productCount: number
}

/** Backend uses single title/description. placement: 'hero' = home hero slider, 'offer' = product offer */
export interface Slide {
  id: string
  title: string
  description: string
  imageUrl: string
  productId: string | null
  position: number
  status: 'active' | 'inactive'
  placement?: 'hero' | 'offer'
}

export interface CreateSlideInput {
  title: string
  description?: string
  productId: string | null
  image: File
  placement?: 'hero' | 'offer'
}

interface StoreSettings {
  nameAr: string
  nameEn: string
  phone: string
  email: string
  addressAr: string
  addressEn: string
  freeShippingThreshold: number
  cairoFees: number
  gizaFees: number
  alexandriaFees: number
  otherGovernoratesFees: number
  codEnabled: boolean
  cardEnabled: boolean
  orderConfirmationSms: boolean
  shippingUpdates: boolean
  deliveryConfirmation: boolean
}

// Query Keys
export const adminKeys = {
  all: ['admin'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  products: () => [...adminKeys.all, 'products'] as const,
  product: (id: string) => [...adminKeys.products(), id] as const,
  orders: () => [...adminKeys.all, 'orders'] as const,
  order: (id: string) => [...adminKeys.orders(), id] as const,
  customers: () => [...adminKeys.all, 'customers'] as const,
  coupons: () => [...adminKeys.all, 'coupons'] as const,
  categories: () => [...adminKeys.all, 'categories'] as const,
  slides: () => [...adminKeys.all, 'slides'] as const,
  settings: ['admin', 'settings'] as const,
}

// API Functions
export const adminApi = {
  getDashboard: () => request<DashboardAnalytics>('/admin/analytics/dashboard'),
  getProducts: (params?: Record<string, string>) =>
    request<AdminProductsResponse>(`/admin/products${params ? `?${new URLSearchParams(params)}` : ''}`),
  getProduct: (id: string) => request<AdminProduct>(`/admin/products/${id}`),
  createProduct: (data: AdminProductCreateInput) =>
    request<AdminProduct>('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: AdminProductUpdateInput) =>
    request<AdminProduct>(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<void>(`/admin/products/${id}`, { method: 'DELETE' }),
  updateProductInventory: (id: string, variants: Array<{ id: string; sizes: Array<{ size: string; quantity: number }> }>) =>
    request<{ message: string }>(`/admin/products/${id}/inventory`, {
      method: 'PUT',
      body: JSON.stringify({ variants }),
    }),
  uploadProductImage: async (productCode: string, colorName: string, image: File) => {
    const form = new FormData()
    form.append('productCode', productCode)
    form.append('colorName', colorName)
    form.append('image', image)
    const res = await request<{ imageUrls: string[] }>('/admin/products/upload-images', {
      method: 'POST',
      body: form,
    })
    return res.imageUrls[0] ?? ''
  },

  getOrders: async (params?: Record<string, string>) => {
    const r = await request<{
      orders?: Array<Record<string, unknown> & { id: string; userName?: string; userPhone?: string; total?: number; status?: string; createdAt?: string; items?: OrderItem[] }>
      total: number
      pages: number
      currentPage: number
    }>(`/admin/orders${params ? `?${new URLSearchParams(params)}` : ''}`)
    return {
      orders: (r.orders ?? []).map((o) => ({
        id: o.id,
        customerName: (o.userName ?? o.customerName) as string,
        customerPhone: (o.userPhone ?? o.customerPhone) as string,
        items: (o.items ?? []) as OrderItem[],
        total: (o.total ?? 0) as number,
        status: (o.status ?? 'pending') as Order['status'],
        createdAt: (o.createdAt ?? '') as string,
      })) as Order[],
      total: r.total ?? 0,
      pages: r.pages ?? 1,
      currentPage: r.currentPage ?? 1,
    } as AdminOrdersResponse
  },
  getOrder: (id: string) => request<Order>(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: Order['status']) =>
    request<Order>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getCustomers: async (params?: Record<string, string>) => {
    const r = await request<{
      customers: Array<Record<string, unknown> & { id: string; name?: string; phone?: string; createdAt?: string; orderCount?: number; totalSpent?: number; addresses?: Array<{ governorate?: string; district?: string; details?: string }> }>
      total: number
      pages: number
      currentPage: number
    }>(`/admin/customers${params ? `?${new URLSearchParams(params)}` : ''}`)
    return {
      customers: (r.customers || []).map((c) => ({
        id: c.id,
        name: (c.name as string) ?? '',
        phone: (c.phone as string) ?? '',
        ordersCount: (c.orderCount ?? c.ordersCount) as number ?? 0,
        totalSpent: (c.totalSpent as number) ?? 0,
        joinedAt: (c.createdAt as string) ?? (c.joinedAt as string) ?? '',
        addresses: (c.addresses as Customer['addresses']) ?? [],
      })) as Customer[],
      total: r.total ?? 0,
      pages: r.pages ?? 1,
      currentPage: r.currentPage ?? 1,
    } as AdminCustomersResponse
  },
  getCustomer: async (id: string) => {
    const c = await request<Record<string, unknown> & { id: string; name?: string; phone?: string; createdAt?: string; joinedAt?: string; orderCount?: number; totalSpent?: number; addresses?: Array<{ governorate?: string; district?: string; details?: string }> }>(
      `/admin/customers/${id}`
    )
    return {
      id: c.id,
      name: (c.name as string) ?? '',
      phone: (c.phone as string) ?? '',
      ordersCount: (c.orderCount ?? (c as Record<string, unknown>).ordersCount as number) ?? 0,
      totalSpent: (c.totalSpent as number) ?? 0,
      joinedAt: (c.createdAt ?? c.joinedAt) as string ?? '',
      addresses: (c.addresses as Customer['addresses']) ?? [],
    } as Customer
  },

  getCoupons: async () => {
    const r = await request<{
      coupons?: Array<Record<string, unknown> & { id: string; code: string; discountType?: string; discountValue?: number; maxUses?: number; usedCount?: number; status: string; startDate?: string; endDate?: string }>
      total: number
      pages: number
      currentPage: number
    }>('/admin/coupons')
    return {
      coupons: (r.coupons || []).map((c) => ({
        id: c.id,
        code: c.code,
        type: ((c.discountType ?? (c as Record<string, unknown>).type) ?? 'percentage') as 'percentage' | 'fixed',
        value: (c.discountValue ?? (c as Record<string, unknown>).value as number) ?? 0,
        usageLimit: (c.maxUses ?? (c as Record<string, unknown>).usageLimit as number) ?? 0,
        usageCount: (c.usedCount ?? (c as Record<string, unknown>).usageCount as number) ?? 0,
        status: (c.status === 'expired' || c.status === 'active' ? c.status : 'active') as 'active' | 'expired',
        startDate: (c.startDate ?? (c as Record<string, unknown>).startDate as string) ?? '',
        expiresAt: (c.endDate ?? (c as Record<string, unknown>).expiresAt as string) ?? '',
      })) as Coupon[],
      total: r.total ?? 0,
      pages: r.pages ?? 1,
      currentPage: r.currentPage ?? 1,
    } as AdminCouponsResponse
  },
  createCoupon: (data: Partial<Coupon>) =>
    request<Coupon>('/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
  updateCoupon: (id: string, data: Partial<Coupon>) =>
    request<Coupon>(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCoupon: (id: string) => request<void>(`/admin/coupons/${id}`, { method: 'DELETE' }),

  getCategories: () =>
    request<Category[]>('/admin/categories').then((list) =>
      (list ?? []).map((c) => ({
        id: c.id as string,
        slug: c.slug as string,
        nameAr: (c.nameAr as string) ?? '',
        nameEn: (c.nameEn as string) ?? '',
        sortOrder: (c.sortOrder as number) ?? 0,
        productCount: (c.productCount as number) ?? 0,
      }))
    ),
  createCategory: (data: { slug: string; nameAr: string; nameEn: string; sortOrder?: number }) =>
    request<Category>('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Partial<Pick<Category, 'slug' | 'nameAr' | 'nameEn' | 'sortOrder'>>) =>
    request<Category>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request<void>(`/admin/categories/${id}`, { method: 'DELETE' }),

  getSlides: () => request<Slide[]>('/admin/slides'),
  createSlide: async (data: CreateSlideInput) => {
    const form = new FormData()
    form.append('title', data.title)
    form.append('description', data.description ?? '')
    form.append('productId', data.productId ?? '')
    form.append('placement', data.placement ?? 'offer')
    form.append('image', data.image)
    return request<Slide>('/admin/slides', { method: 'POST', body: form })
  },
  updateSlide: async (id: string, data: Partial<Slide>, image?: File) => {
    if (image) {
      const form = new FormData()
      if (data.title != null) form.append('title', data.title)
      form.append('description', data.description ?? '')
      form.append('productId', data.productId ?? '')
      form.append('position', String(data.position ?? 0))
      form.append('status', data.status ?? 'active')
      form.append('image', image)
      return request<Slide>(`/admin/slides/${id}`, { method: 'PUT', body: form })
    }
    return request<Slide>(`/admin/slides/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  deleteSlide: (id: string) => request<void>(`/admin/slides/${id}`, { method: 'DELETE' }),

  getSettings: () => request<StoreSettings>('/admin/settings'),
  updateSettings: (data: Partial<StoreSettings>) =>
    request<StoreSettings>('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
}

// Hooks
export function useDashboard() {
  return useQuery<DashboardAnalytics, ApiError>({
    queryKey: adminKeys.dashboard,
    queryFn: adminApi.getDashboard,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useAdminProducts(filters?: Record<string, string>) {
  return useQuery<AdminProductsResponse, ApiError>({
    queryKey: [...adminKeys.products(), filters],
    queryFn: () => adminApi.getProducts(filters),
  })
}

export function useAdminProduct(id: string) {
  return useQuery<AdminProduct, ApiError>({
    queryKey: adminKeys.product(id),
    queryFn: () => adminApi.getProduct(id),
    enabled: !!id,
  })
}

/** Customer-facing product query keys (so admin changes show on frontend) */
const customerProductKeys = {
  list: ['products'] as const,
  detail: ['product'] as const,
  category: ['category-products'] as const,
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation<AdminProduct, ApiError, AdminProductCreateInput>({
    mutationFn: adminApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products() })
      queryClient.invalidateQueries({ queryKey: customerProductKeys.list })
      queryClient.invalidateQueries({ queryKey: customerProductKeys.detail })
      queryClient.invalidateQueries({ queryKey: customerProductKeys.category })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation<AdminProduct, ApiError, { id: string; data: AdminProductUpdateInput }>({
    mutationFn: ({ id, data }) => adminApi.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.product(id) })
      queryClient.invalidateQueries({ queryKey: adminKeys.products() })
      queryClient.invalidateQueries({ queryKey: customerProductKeys.list })
      queryClient.invalidateQueries({ queryKey: customerProductKeys.detail })
      queryClient.invalidateQueries({ queryKey: customerProductKeys.category })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, string>({
    mutationFn: adminApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products() })
      queryClient.invalidateQueries({ queryKey: customerProductKeys.list })
      queryClient.invalidateQueries({ queryKey: customerProductKeys.detail })
      queryClient.invalidateQueries({ queryKey: customerProductKeys.category })
    },
  })
}

export function useUpdateProductInventory() {
  const queryClient = useQueryClient()
  return useMutation<
    { message: string },
    ApiError,
    { id: string; variants: Array<{ id: string; sizes: Array<{ size: string; quantity: number }> }> }
  >({
    mutationFn: ({ id, variants }) => adminApi.updateProductInventory(id, variants),
    onSuccess: async (_, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.product(id) }),
        queryClient.invalidateQueries({ queryKey: adminKeys.products() }),
        queryClient.invalidateQueries({ queryKey: customerProductKeys.list }),
        queryClient.invalidateQueries({ queryKey: customerProductKeys.detail }),
        queryClient.invalidateQueries({ queryKey: customerProductKeys.category }),
      ])
    },
  })
}

export function useAdminOrders(filters?: Record<string, string>) {
  return useQuery<AdminOrdersResponse, ApiError>({
    queryKey: [...adminKeys.orders(), filters],
    queryFn: () => adminApi.getOrders(filters),
  })
}

/** Orders for a specific customer — for CustomersPage detail modal */
export function useAdminOrdersByCustomer(customerId: string | null) {
  return useQuery<AdminOrdersResponse, ApiError>({
    queryKey: [...adminKeys.orders(), 'byCustomer', customerId],
    queryFn: () => adminApi.getOrders({ userId: customerId!, perPage: '50' }),
    enabled: !!customerId,
  })
}

export function useAdminOrder(id: string) {
  return useQuery<Order, ApiError>({
    queryKey: adminKeys.order(id),
    queryFn: () => adminApi.getOrder(id),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation<Order, ApiError, { id: string; status: Order['status'] }>({
    mutationFn: ({ id, status }) => adminApi.updateOrderStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.order(id) })
      queryClient.invalidateQueries({ queryKey: adminKeys.orders() })
    },
  })
}

export function useAdminCustomers(filters?: Record<string, string>) {
  return useQuery<AdminCustomersResponse, ApiError>({
    queryKey: [...adminKeys.customers(), filters],
    queryFn: () => adminApi.getCustomers(filters),
  })
}

export function useAdminCoupons() {
  return useQuery<AdminCouponsResponse, ApiError>({
    queryKey: adminKeys.coupons(),
    queryFn: adminApi.getCoupons,
  })
}

export function useCreateCoupon() {
  const queryClient = useQueryClient()
  return useMutation<Coupon, ApiError, Partial<Coupon>>({
    mutationFn: adminApi.createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.coupons() })
    },
  })
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient()
  return useMutation<Coupon, ApiError, { id: string; data: Partial<Coupon> }>({
    mutationFn: ({ id, data }) => adminApi.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.coupons() })
    },
  })
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, string>({
    mutationFn: adminApi.deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.coupons() })
    },
  })
}

export function useAdminCategories() {
  return useQuery<Category[], ApiError>({
    queryKey: adminKeys.categories(),
    queryFn: adminApi.getCategories,
  })
}

/** Customer categories query key — used by HomePage, Header, Footer, ProductsPage */
const customerCategoriesKey = ['categories'] as const

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation<Category, ApiError, Parameters<typeof adminApi.createCategory>[0]>({
    mutationFn: adminApi.createCategory,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.categories() }),
        queryClient.invalidateQueries({ queryKey: customerCategoriesKey }),
      ])
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation<Category, ApiError, { id: string; data: Parameters<typeof adminApi.updateCategory>[1] }>({
    mutationFn: ({ id, data }) => adminApi.updateCategory(id, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.categories() }),
        queryClient.invalidateQueries({ queryKey: customerCategoriesKey }),
      ])
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, string>({
    mutationFn: adminApi.deleteCategory,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.categories() }),
        queryClient.invalidateQueries({ queryKey: customerCategoriesKey }),
      ])
    },
  })
}

export function useAdminSlides() {
  return useQuery<Slide[], ApiError>({
    queryKey: adminKeys.slides(),
    queryFn: adminApi.getSlides,
  })
}

export function useCreateSlide() {
  const queryClient = useQueryClient()
  return useMutation<Slide, ApiError, CreateSlideInput>({
    mutationFn: adminApi.createSlide,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.slides() })
      await queryClient.refetchQueries({ queryKey: ['slides'] })
    },
  })
}

export function useUpdateSlide() {
  const queryClient = useQueryClient()
  return useMutation<Slide, ApiError, { id: string; data: Partial<Slide>; image?: File }>({
    mutationFn: ({ id, data, image }) => adminApi.updateSlide(id, data, image),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.slides() })
      await queryClient.refetchQueries({ queryKey: ['slides'] })
    },
  })
}

export function useDeleteSlide() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, string>({
    mutationFn: adminApi.deleteSlide,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.slides() })
      await queryClient.refetchQueries({ queryKey: ['slides'] })
    },
  })
}

export function useAdminSettings() {
  return useQuery<StoreSettings, ApiError>({
    queryKey: adminKeys.settings,
    queryFn: adminApi.getSettings,
    staleTime: Infinity,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation<StoreSettings, ApiError, Partial<StoreSettings>>({
    mutationFn: adminApi.updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(adminKeys.settings, data)
    },
  })
}

// Type exports
export type {
  DashboardAnalytics,
  Order,
  OrderItem,
  Product,
  Customer,
  StoreSettings,
}
// export type { Category }
