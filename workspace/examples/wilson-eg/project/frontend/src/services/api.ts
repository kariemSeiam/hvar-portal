import type { Product, Category, Order, Coupon, PaginatedResponse } from '@/types'
import {
  mapBackendProductToFrontend,
  mapBackendProductsResponse,
  type BackendProduct,
} from '@/lib/productAdapter'

const rawBase = import.meta.env.VITE_API_URL || ''
const API_BASE = rawBase ? (rawBase.endsWith('/api') ? rawBase : rawBase.replace(/\/?$/, '') + '/api') : '/api'

/** Use relative path for slide/upload URLs so img loads via dev proxy (same origin). */
export function getUploadImageSrc(fullUrl: string): string {
  if (!fullUrl) return fullUrl
  const origin = API_BASE.replace(/\/api\/?$/, '')
  if (origin && fullUrl.startsWith(origin + '/')) return fullUrl.slice(origin.length)
  return fullUrl
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('wilson-token')

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new ApiError(
      error.message || 'Request failed',
      response.status,
      error.code,
      error.details
    )
  }

  return response.json()
}

/** Backend returns products, total, pages, currentPage. We map to PaginatedResponse<Product>. */
async function fetchProducts(endpoint: string): Promise<PaginatedResponse<Product>> {
  const data = await request<{
    products?: BackendProduct[]
    total: number
    pages: number
    currentPage: number
  }>(endpoint)
  return mapBackendProductsResponse(data)
}

export const productsApi = {
  getAll: (params?: {
    category?: string
    minPrice?: number
    maxPrice?: number
    sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular'
    page?: number
    limit?: number
    search?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      const { sort, ...rest } = params
      Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
      // Backend uses: sort=popular|newest|price-asc|price-desc
      if (sort) {
        const mapped =
          sort === 'price_asc'
            ? 'price-asc'
            : sort === 'price_desc'
              ? 'price-desc'
              : sort === 'newest'
                ? 'newest'
                : 'popular'
        searchParams.set('sort', mapped)
      }
    }
    const query = searchParams.toString()
    return fetchProducts(`/products${query ? `?${query}` : ''}`)
  },

  /** Fetch by UUID or SKU; backend resolves by id or code. */
  getById: async (id: string) => {
    const raw = await request<BackendProduct>(`/products/${encodeURIComponent(id)}`)
    return mapBackendProductToFrontend(raw)
  },

  getBySku: async (sku: string) => {
    const raw = await request<BackendProduct>(`/products/${encodeURIComponent(sku)}`)
    return mapBackendProductToFrontend(raw)
  },

  getByCategory: (category: string, params?: { page?: number; limit?: number }) =>
    productsApi.getAll({ ...params, category }),

  search: (q: string, params?: { page?: number; limit?: number }) =>
    productsApi.getAll({ ...params, search: q }),

  getFeatured: async (): Promise<Product[]> => {
    const res = await fetchProducts('/products?sort=popular&page=1')
    return res.items.slice(0, 8)
  },

  getRelated: async (excludeId: string): Promise<Product[]> => {
    const res = await fetchProducts('/products?sort=popular&page=1')
    return res.items.filter((p) => p.id !== excludeId).slice(0, 4)
  },

  getReviews: (_id: string, _params?: { page?: number; limit?: number }) =>
    Promise.resolve({ items: [], total: 0, pages: 0, currentPage: 1 }),

  addReview: (_id: string, _data: { rating: number; comment: string }) =>
    Promise.reject(new Error('Reviews not implemented')),
}

export const categoriesApi = {
  getAll: () => request<Category[]>('/categories'),

  getBySlug: (slug: string) => request<Category>(`/categories/${slug}`),
}

/** Backend user orders response shape */
interface BackendUserOrdersResponse {
  orders: Array<{
    id: string
    totalQuantity: number
    shippingFee: number
    subtotal: number
    discount: number
    total: number
    status: string
    createdAt: string
    items: Array<{
      productName: string
      variant: string
      size: string
      quantity: number
      price: number
      totalPrice: number
      image: string | null
    }>
    tracking: Array<{
      status: string
      description: string
      timestamp: string
      completed: boolean
    }>
    coupon: { code: string; discountType: string; discountValue: number; discountAmount: number } | null
  }>
  total: number
  pages: number
  currentPage: number
}

export const ordersApi = {
  create: (data: {
    items: Array<{ variant_id: string; size: string; quantity: number }>
    addressId?: string
    paymentMethod: 'cod' | 'card'
    coupon?: string
  }) =>
    request<Order & { id: string; total: number; status: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: data.items,
        addressId: data.addressId,
        paymentMethod: data.paymentMethod,
        coupon: data.coupon,
      }),
    }),

  getAll: async (params?: { page?: number; perPage?: number }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    const data = await request<BackendUserOrdersResponse>(`/orders${query ? `?${query}` : ''}`)
    return {
      items: data.orders.map((o) => ({
        id: o.id,
        status: o.status as Order['status'],
        total: o.total,
        subtotal: o.subtotal,
        shipping: o.shippingFee,
        discount: o.discount,
        createdAt: o.createdAt,
        items: o.items,
        tracking: o.tracking,
        coupon: o.coupon,
      })),
      total: data.total,
      pages: data.pages,
      currentPage: data.currentPage,
    } as PaginatedResponse<Order & { items: BackendUserOrdersResponse['orders'][0]['items']; tracking: BackendUserOrdersResponse['orders'][0]['tracking'] }>
  },

  getTrack: (orderId: string) =>
    request<{
      id: string
      status: string
      tracking_steps: Array<{
        status: string
        description: string
        timestamp: string
        completed?: boolean
      }>
    }>(`/orders/${orderId}/track`),

  cancel: (id: string) => request<Order>(`/orders/${id}/cancel`, { method: 'POST' }),
}

export const favoritesApi = {
  toggle: (productId: string) =>
    request<{ message: string }>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    }),

  getAll: async (params?: { page?: number; perPage?: number }) => {
    const sp = new URLSearchParams()
    if (params) {
      if (params.page !== undefined) sp.set('page', String(params.page))
      if (params.perPage !== undefined) sp.set('perPage', String(params.perPage))
    }
    const q = sp.toString()
    const data = await request<{
      favorites: BackendProduct[]
      total: number
      pages: number
      currentPage: number
    }>(`/favorites${q ? `?${q}` : ''}`)
    return {
      items: data.favorites.map((p) => mapBackendProductToFrontend(p)),
      total: data.total,
      pages: data.pages,
      currentPage: data.currentPage,
    } as PaginatedResponse<Product>
  },

  getStatus: (productId: string) =>
    request<{ isFavorite: boolean; productId: string }>(`/favorites/${productId}/status`),
}

export const couponsApi = {
  validate: (code: string, subtotal: number) =>
    request<Coupon & { discountAmount: number }>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    }),
}

export const contactApi = {
  sendMessage: (data: { name: string; phone: string; message: string }) =>
    request<{ success: boolean }>('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const analyticsApi = {
  getDashboard: (period?: 'today' | 'week' | 'month' | 'year' | 'all') => {
    const q = period ? `?period=${period}` : ''
    return request<{
      totalSales: number
      orderCount: number
      previousOrderCount: number
      avgOrderValue: number
      previousAvgOrderValue: number
      ordersByStatus: Record<string, number>
      retention: { rate: number; returningCustomers: number; totalCustomers: number }
      topProducts: Array<{ id: string; name: string; orderCount: number; quantity: number; revenue: number; avgPrice: number }>
      revenueChart: Array<{ date: string; revenue: number; orders: number }>
    }>(`/admin/analytics/dashboard${q}`)
  },
}

/** Public slides (admin-managed; used for home hero and product offers) */
export interface PublicSlideItem {
  id: string
  title: string
  description: string
  imageUrl: string
  /** Full product when slide is linked to a product; has code (SKU) for /products/:sku */
  product?: { id: string; code: string; nameAr?: string; nameEn?: string } | null
}

export const slidesApi = {
  getSlides: () => request<PublicSlideItem[]>('/slides'),
}

export const adminOrdersApi = {
  getAll: (params?: { page?: number; perPage?: number; status?: string }) => {
    const sp = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) sp.set(k, String(v))
      })
    }
    const q = sp.toString()
    return request<{
      orders: Array<{ id: string; userName: string; userPhone: string; total: number; status: string; createdAt: string }>
      total: number
      pages: number
      currentPage: number
    }>(`/admin/orders${q ? `?${q}` : ''}`)
  },
}

export { ApiError }
