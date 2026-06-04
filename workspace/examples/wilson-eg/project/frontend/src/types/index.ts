export type Language = 'ar' | 'en'

export interface User {
  id: string
  phone: string
  name: string | null
  email: string | null
  role: 'user' | 'admin'
  isProfileComplete: boolean
  createdAt: string
}

export interface Product {
  id: string
  sku: string
  nameAr: string
  nameEn: string
  descriptionAr: string
  descriptionEn: string
  category: string
  basePrice: number
  discountPrice: number | null
  tag: string | null
  tagColor: string | null
  rating: number
  ratingCount: number
  status: 'active' | 'inactive'
  features: string[]
  featuresAr?: string[]
  featuresEn?: string[]
  specifications: ProductSpecification
  images: string[]
  thumbnail: string
  views: number
  salesCount: number
  isFavorite: boolean
  warrantyYears: number
  energyRating: string | null
  inStock: boolean
  stockQuantity: number
  createdAt: string
  /** Default variant/size for cart and checkout; both must be set for the item to be orderable. */
  variantId?: string
  /** Default size for cart and checkout; set only when variant has at least one size. */
  size?: string
  /** Variants (options) and sizes with stock — shown on product detail page */
  variants?: ProductVariantFront[]
}

export interface ProductVariantFront {
  id: string
  colorName: string
  colorCode: string
  images: string[]
  sizes: Array<{ size: string; inStock: boolean; quantity: number }>
}

export interface ProductSpecification {
  capacity?: string
  voltage?: string
  power?: string
  dimensions?: string
  weight?: string
  color?: string
  material?: string
  [key: string]: string | undefined
}

export interface CartItem {
  id: string
  product: Product
  quantity: number
  price: number
}

export interface Address {
  id: string
  governorate: string
  district: string
  details: string
  isDefault: boolean
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  status: OrderStatus
  paymentMethod: 'cod' | 'card'
  address: Address
  coupon: Coupon | null
  tracking: OrderTracking[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  price: number
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderTracking {
  id: string
  status: OrderStatus
  description: string
  timestamp: string
  completed: boolean
}

export interface Coupon {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  discountAmount?: number
  status: 'active' | 'inactive'
  maxUses: number
  usedCount: number
  startDate: string
  endDate: string
}

export interface OfferSlide {
  id: string
  title: string
  description: string
  imageUrl: string
  productId: string
  product?: Product
  position: number
  status: 'active' | 'inactive'
}

export interface Category {
  id: string
  slug: string
  nameAr: string
  nameEn: string
  icon?: string
  productCount: number
}

export interface Review {
  id: string
  userId: string
  userName: string
  productId: string
  rating: number
  comment: string
  createdAt: string
}

export interface DashboardAnalytics {
  totalSales: number
  orderCount: number
  previousOrderCount: number
  avgOrderValue: number
  previousAvgOrderValue: number
  ordersByStatus: Record<OrderStatus, number>
  retention: {
    rate: number
    returningCustomers: number
    totalCustomers: number
  }
  topProducts: Array<{
    id: string
    name: string
    orderCount: number
    quantity: number
    revenue: number
    avgPrice: number
  }>
  revenueChart: Array<{
    date: string
    revenue: number
    orders: number
  }>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  pages: number
  currentPage: number
}

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, string[]>
}
