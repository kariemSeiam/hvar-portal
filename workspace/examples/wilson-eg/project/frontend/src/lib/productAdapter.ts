/**
 * Adapter: Maps backend API product format to frontend Product type.
 * Backend (Flask) returns: id, name, code, basePrice, discountPrice, variants with sizes/images.
 * Frontend expects: id, sku, nameAr, nameEn, specifications, images, etc.
 * Names are cleaned so the title never includes the SKU (SKU is shown in its own element).
 */
import type { Product, ProductSpecification } from '@/types'

/** Remove SKU/code from name so it's not duplicated next to the SKU field. */
function nameWithoutSku(name: string, code: string): string {
  if (!name || !code) return name
  const c = code.trim()
  let out = name.trim()
  // Trailing: " WF240", " - WF240", " (WF240)", " (WF240)"
  const trailing = new RegExp(`[\\s\\-–—(（]+${escapeRegex(c)}\\s*$`, 'i')
  out = out.replace(trailing, '').trim()
  // Leading: "WF240 ", "W-ST90MS "
  const leading = new RegExp(`^${escapeRegex(c)}[\\s\\-–—)\\）]?\\s*`, 'i')
  out = out.replace(leading, '').trim()
  return out || name
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface BackendProduct {
  id: string
  name: string
  nameAr?: string
  nameEn?: string
  code: string
  description?: string | null
  descriptionAr?: string | null
  descriptionEn?: string | null
  category: string
  basePrice: number
  discountPrice?: number | null
  tag?: string | null
  tagColor?: string | null
  rating: number
  ratingCount: number
  status: string
  features: string[]
  featuresAr?: string[]
  featuresEn?: string[]
  variants: Array<{
    id: string
    colorName: string
    colorCode: string
    images: string[]
    sizes: Array<{ size: string; inStock: boolean; quantity: number }>
  }>
  views: number
  salesCount: number
  isFavorite?: boolean
  createdAt?: string
  updatedAt?: string
}

export function mapBackendProductToFrontend(raw: BackendProduct): Product {
  const firstVariant = raw.variants?.[0]
  const allImages: string[] = raw.variants?.flatMap((v) => v.images || []) ?? []
  const firstImage = allImages[0] ?? ''
  const totalStock = raw.variants?.flatMap((v) => v.sizes || []).reduce((s, sz) => s + sz.quantity, 0) ?? 0
  const inStock = raw.variants?.some((v) => v.sizes?.some((s) => s.inStock)) ?? false

  // Build specifications from features + variant sizes (appliances: size = capacity/spec)
  const specs: ProductSpecification = {}
  if (firstVariant?.sizes?.length) {
    const firstSize = firstVariant.sizes[0]
    specs.capacity = firstSize.size
  }
  raw.features?.forEach((f) => {
    const [key, val] = f.includes(':') ? f.split(/:(.+)/) : [f, '']
    const k = key.trim().toLowerCase().replace(/\s+/g, '')
    if (val) specs[k] = val.trim()
  })

  // Default variant/size for cart and checkout; required for placing an order. Only set size when variant has at least one size (no fake fallback).
  const hasSizes = (firstVariant?.sizes?.length ?? 0) >= 1
  const defaultSize = hasSizes
    ? (firstVariant!.sizes!.find((s) => s.inStock)?.size ?? firstVariant!.sizes![0].size)
    : undefined

  const code = raw.code?.trim() ?? ''
  const rawNameAr = (raw.nameAr ?? raw.name ?? '').trim()
  const rawNameEn = (raw.nameEn ?? raw.name ?? '').trim()

  return {
    id: raw.id,
    sku: raw.code,
    variantId: firstVariant?.id,
    size: defaultSize,
    nameAr: code ? nameWithoutSku(rawNameAr, code) : rawNameAr,
    nameEn: code ? nameWithoutSku(rawNameEn, code) : rawNameEn,
    descriptionAr: raw.descriptionAr ?? raw.description ?? '',
    descriptionEn: raw.descriptionEn ?? raw.description ?? '',
    category: raw.category,
    basePrice: raw.basePrice,
    discountPrice: raw.discountPrice ?? null,
    tag: raw.tag ?? null,
    tagColor: raw.tagColor ?? null,
    rating: raw.rating ?? 0,
    ratingCount: raw.ratingCount ?? 0,
    status: (raw.status as 'active' | 'inactive') ?? 'active',
    features: raw.features ?? [],
    featuresAr: raw.featuresAr ?? raw.features ?? [],
    featuresEn: raw.featuresEn ?? raw.features ?? [],
    specifications: specs,
    images: allImages,
    thumbnail: firstImage,
    views: raw.views ?? 0,
    salesCount: raw.salesCount ?? 0,
    isFavorite: raw.isFavorite ?? false,
    warrantyYears: 5, // Wilson standard - could come from specs
    energyRating: null,
    inStock,
    stockQuantity: totalStock || (inStock ? 1 : 0),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    variants: raw.variants ?? [],
  }
}

export function mapBackendProductsResponse(data: {
  products?: BackendProduct[]
  items?: BackendProduct[]
  total: number
  pages: number
  currentPage: number
}) {
  const products = data.products ?? data.items ?? []
  return {
    items: products.map(mapBackendProductToFrontend),
    total: data.total,
    pages: data.pages,
    currentPage: data.currentPage,
  }
}
