/**
 * ProductDetailPage — Wilson Egypt spec
 * Sticky CTA on mobile, Features strip, Notify Me when out of stock, WhatsApp primary
 */
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  ShoppingCart,
  Share2,
  Check,
  Minus,
  Plus,
  Trash2,
  Bell,
  ImageOff,
  Star,
  MessageCircle,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { productsApi } from '@/services/api'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { ProductCard } from '@/components/customer/ProductCard'
import { PageBreadcrumb } from '@/components/customer/PageBreadcrumb'
import { cn } from '@/lib/utils'
import { WHATSAPP_URL } from '@/components/customer/checkout/constants'

const ProductDetailPage = () => {
  const { sku } = useParams<{ sku: string }>()
  const { t, language } = useLanguage()
  const { addItem, isInCart, getItemQuantity, removeItem } = useCart()
  const { ids: recentlyViewedSkus, add: addRecentlyViewed, remove: removeRecentlyViewed } = useRecentlyViewed()
  const [quantity, setQuantity] = useState(1)
  const [imgIndex, setImgIndex] = useState(0)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifySubmitted, setNotifySubmitted] = useState(false)
  const [showInquiryHint, setShowInquiryHint] = useState(true)

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', sku],
    queryFn: () => productsApi.getBySku(sku!),
    enabled: !!sku,
  })

  const { data: relatedProducts } = useQuery({
    queryKey: ['related', product?.id],
    queryFn: () => productsApi.getRelated(product!.id),
    enabled: !!product?.id,
  })

  const { data: recentlyViewedProducts } = useQuery({
    queryKey: ['products', recentlyViewedSkus],
    queryFn: async () => {
      const toFetch = recentlyViewedSkus.filter((s) => s !== sku).slice(0, 4)
      const results = await Promise.all(
        toFetch.map(async (s) => {
          try {
            return await productsApi.getBySku(s)
          } catch {
            removeRecentlyViewed(s) // Prune stale SKU so we don't 404 on every load
            return null
          }
        })
      )
      return results.filter(Boolean) as Awaited<ReturnType<typeof productsApi.getBySku>>[]
    },
    enabled: recentlyViewedSkus.length > 0 && !!sku,
  })

  useEffect(() => {
    if (product?.sku) addRecentlyViewed(product.sku)
  }, [product?.sku, addRecentlyViewed])

  const inCartForEffect = product ? isInCart(product.id) : false
  useEffect(() => {
    if (!product?.id || inCartForEffect) return
    const t = setTimeout(() => setShowInquiryHint(false), 4000)
    return () => clearTimeout(t)
  }, [product?.id, inCartForEffect])

  if (!sku) {
    return (
      <div className="container-wide section-padding-sm text-center">
        <p className="text-muted-foreground">{language === 'ar' ? 'معرف المنتج مطلوب' : 'Product required'}</p>
        <Button asChild className="mt-4 min-h-touch">
          <Link to="/products">{t('nav.products')}</Link>
        </Button>
      </div>
    )
  }

  if (isLoading || !product) {
    return (
      <div className="container-wide section-padding-sm">
        <div className="animate-pulse grid lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-12 bg-muted rounded w-1/3" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-wide section-padding-sm text-center">
        <p className="text-destructive mb-4">
          {language === 'ar' ? 'فشل تحميل المنتج' : 'Failed to load product'}
        </p>
        <Button asChild variant="outline" className="min-h-touch">
          <Link to="/products">{t('nav.products')}</Link>
        </Button>
      </div>
    )
  }

  const price = product.discountPrice ?? product.basePrice
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.basePrice
  const inCart = isInCart(product.id)
  const cartQuantity = getItemQuantity(product.id)
  // Images from selected variant, or fallback to product images
  const variantImages = product.variants?.[selectedVariantIndex]?.images
  const images = (variantImages?.length ? variantImages : product.images?.length ? product.images : product.thumbnail ? [product.thumbnail] : []) as string[]
  const mainImage = images[imgIndex] ?? product.thumbnail ?? ''
  const productName = language === 'ar' ? product.nameAr : product.nameEn

  const handleVariantSelect = (index: number) => {
    setSelectedVariantIndex(index)
    setImgIndex(0)
  }
  const featureList = language === 'ar' ? (product.featuresAr ?? product.features) : (product.featuresEn ?? product.features)

  // Description: use backend only if it's real content (not product name/sku). Otherwise frontend-only fallback.
  const rawDesc = (language === 'ar' ? product.descriptionAr : product.descriptionEn)?.trim() ?? ''
  const isProductNameOrSku = (text: string) => {
    if (!text || text.length < 25) return true
    const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase()
    const nameAr = (product.nameAr ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
    const nameEn = (product.nameEn ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
    const sku = (product.sku ?? '').trim().toLowerCase()
    return normalized === nameAr || normalized === nameEn || normalized === sku || (sku && normalized.startsWith(sku) && normalized.length < 80)
  }
  const hasRealDescription = rawDesc.length > 0 && !isProductNameOrSku(rawDesc)
  const descriptionFallbackAr = 'منتج ويلسون — جودة عالية وضمان أصلي. ضمان شامل وتوصيل لجميع المحافظات.'
  const descriptionFallbackEn = 'Wilson product — high quality and original warranty. Full warranty and delivery across all governorates.'
  const displayDescription = hasRealDescription ? rawDesc : (language === 'ar' ? descriptionFallbackAr : descriptionFallbackEn)

  const handleAddToCart = () => {
    addItem(product, quantity)
    setQuantity(1)
  }

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault()
    setNotifySubmitted(true)
    setNotifyEmail('')
    // Backend endpoint can be added later; for now we show success
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: productName,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  const isRTL = language === 'ar'
  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <PageBreadcrumb
        dir={isRTL ? 'rtl' : 'ltr'}
        containerClassName="container-wide"
        ariaLabel={isRTL ? 'مسار الصفحة' : 'Breadcrumb'}
        items={[
          { label: t('nav.home'), href: '/' },
          { label: t('nav.products'), href: '/products' },
          { label: productName },
        ]}
      />

      <section className="section-padding-product-detail section-creative-warm">
        <div className="container-wide">
          {/* Hero block — gallery + info side by side */}
          <div className="product-detail-hero">
            {/* Gallery — main image + thumb strip (vertical on lg) */}
            <div className="product-detail-gallery-wrap">
              <div className="product-detail-gallery-inner">
                <div className="product-detail-gallery-media flex-1 min-h-0 flex flex-col lg:flex-row lg:gap-4">
                  <div className="flex-1 min-w-0 relative flex items-center justify-center">
                    <div className="w-full flex items-center justify-center overflow-hidden rounded-xl">
                      {mainImage ? (
                        <img src={mainImage} alt={productName} className="product-detail-main-img" />
                      ) : (
                        <div className="aspect-square w-full max-w-sm flex items-center justify-center">
                          <ImageOff className="h-24 w-24 text-muted-foreground/60" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="absolute top-3 start-3 z-10">
                      <span
                        className={cn(
                          'rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
                          product.inStock ? 'bg-success/95 text-white' : 'bg-destructive/95 text-white'
                        )}
                      >
                        {product.inStock ? (language === 'ar' ? 'متوفر' : 'In stock') : (language === 'ar' ? 'غير متوفر' : 'Out of stock')}
                      </span>
                    </div>
                    {/* Color swatches — over image, bottom-end */}
                    {product.variants && product.variants.length > 1 && (
                      <div className="absolute bottom-3 end-3 z-10 flex flex-wrap justify-end gap-2">
                        {product.variants.map((v, vi) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleVariantSelect(vi)}
                            className={cn(
                              'w-8 h-8 rounded-full border-2 shadow-md shrink-0 transition-[box-shadow] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-background/80 backdrop-blur-sm',
                              selectedVariantIndex === vi ? 'ring-2 ring-primary ring-offset-2 border-primary' : 'border-border hover:ring-2 hover:ring-primary/40 hover:ring-offset-2'
                            )}
                            style={{ backgroundColor: v.colorCode }}
                            title={v.colorName}
                            aria-label={language === 'ar' ? `${v.colorName} ${selectedVariantIndex === vi ? '— محدد' : ''}` : `${v.colorName}${selectedVariantIndex === vi ? ' — selected' : ''}`}
                            aria-pressed={selectedVariantIndex === vi}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="product-detail-thumbs">
                      {images.map((img: string, i: number) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setImgIndex(i)}
                          className="product-detail-thumb"
                          data-active={i === imgIndex ? 'true' : undefined}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info — name, price, actions, trust strip */}
            <div className="product-detail-info relative">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight min-w-0 flex-1">{productName}</h1>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label={language === 'ar' ? 'مشاركة' : 'Share'}
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm flex-wrap">
                {product.rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary shrink-0" aria-hidden />
                    {product.rating.toFixed(1)} ({product.ratingCount} {language === 'ar' ? 'تقييم' : 'reviews'})
                  </span>
                )}
                <span className="text-muted-foreground">SKU: {product.sku}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-primary">{price.toLocaleString()} ج.م</span>
                {hasDiscount && <span className="text-lg text-muted-foreground line-through">{product.basePrice.toLocaleString()}</span>}
              </div>

              {product.inStock && (
                <div className="product-detail-cta-wrap">
                  <div className="product-detail-cta-bar">
                    <div className="product-detail-cta-bar__stepper">
                      <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="product-detail-cta-bar__stepper-btn" disabled={quantity <= 1} aria-label={language === 'ar' ? 'تقليل' : 'Decrease'}>
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="product-detail-cta-bar__stepper-value" dir="ltr">{quantity}</span>
                      <button type="button" onClick={() => setQuantity(quantity + 1)} className="product-detail-cta-bar__stepper-btn" disabled={quantity >= (product.stockQuantity || 999)} aria-label={language === 'ar' ? 'زيادة' : 'Increase'}>
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {inCart ? (
                      <>
                        <Link to="/cart" className="product-detail-cta-bar__primary">
                          <Check className="h-5 w-5 text-success-600 shrink-0" />
                          <span>{language === 'ar' ? `في السلة (${cartQuantity})` : `In Cart (${cartQuantity})`}</span>
                        </Link>
                        <a href={`${WHATSAPP_URL}?text=${encodeURIComponent(language === 'ar' ? `عندي استفسار عن: ${productName}` : `I have a question about: ${productName}`)}`} target="_blank" rel="noopener noreferrer" className="product-detail-cta-bar__inquiry" aria-label={t('products.inquiryWhatsApp')}>
                          <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
                          <span className="sm:hidden">{t('products.inquiryShort')}</span>
                          <span className="hidden sm:inline">{t('products.inquiryWhatsApp')}</span>
                        </a>
                        <button type="button" onClick={() => removeItem(product.id)} className="product-detail-cta-bar__remove" aria-label={language === 'ar' ? 'إزالة من السلة' : 'Remove from cart'}>
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={handleAddToCart} className="product-detail-cta-bar__primary product-detail-cta-bar__primary--gold">
                          <ShoppingCart className="h-5 w-5 shrink-0" />
                          <span className="sm:hidden">{t('products.addToCartShort')}</span>
                          <span className="hidden sm:inline">{t('products.addToCart')}</span>
                        </button>
                        <a href={`${WHATSAPP_URL}?text=${encodeURIComponent(language === 'ar' ? `عندي استفسار عن: ${productName}` : `I have a question about: ${productName}`)}`} target="_blank" rel="noopener noreferrer" className="product-detail-cta-bar__inquiry" aria-label={t('products.inquiryWhatsApp')}>
                          <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
                          <span className="sm:hidden">{t('products.inquiryShort')}</span>
                          <span className="hidden sm:inline">{t('products.inquiryWhatsApp')}</span>
                        </a>
                      </>
                    )}
                  </div>
                  <p className={cn('product-detail-cta-inquiry-hint', !showInquiryHint && 'product-detail-cta-inquiry-hint--hidden')} aria-hidden>
                    {t('products.inquiryHint')}
                  </p>
                </div>
              )}

              {!product.inStock && (
                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Bell className="h-4 w-4" /> {language === 'ar' ? 'أخبرني عند التوفر' : 'Notify Me'}</h3>
                  {notifySubmitted ? (
                    <p className="text-success-600 dark:text-success-400 text-sm">{language === 'ar' ? 'شكراً! سنعلمك عند التوفر.' : 'Thanks! We\'ll notify you.'}</p>
                  ) : (
                    <form onSubmit={handleNotifyMe} className="flex gap-2 mt-2">
                      <Input type="email" placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'} value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} className="flex-1" />
                      <Button type="submit" size="lg">{language === 'ar' ? 'إشعارني' : 'Notify'}</Button>
                    </form>
                  )}
                </div>
              )}

              {/* الوصف — description only; Wilson trust copy when no real description */}
              <div className="mt-4 sm:mt-6">
                <h2 className="text-xl font-bold text-foreground title-underline-gold mb-3">{language === 'ar' ? 'الوصف' : 'Description'}</h2>
                <div
                  className="rounded-xl border border-border bg-card/40 ps-4 sm:ps-5 pe-4 sm:pe-5 py-4 sm:py-5 border-s-2 border-s-primary/20 max-w-3xl shadow-sm text-start"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  <p className="text-foreground/90 leading-[1.7] text-[0.9375rem] sm:text-base">{displayDescription}</p>
                </div>
              </div>
            </div>
          </div>

          {/* المميزات — full-width section below hero (web: under image+info bar) */}
          {featureList?.length > 0 && (
            <div className="mt-6 sm:mt-8 w-full">
              <h2 className="text-xl font-bold text-foreground title-underline-gold mb-4">{language === 'ar' ? 'المميزات' : 'Features'}</h2>
              <ul className="product-features-strip list-none p-0 m-0">
                {featureList.map((feature: string, index: number) => (
                  <li key={index}>
                    <Check data-icon className="h-4 w-4" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related + Recently viewed — one block */}
          {(relatedProducts?.length || recentlyViewedProducts?.length) ? (
            <div className="mt-6 sm:mt-8">
              <h2 className="text-xl font-bold text-foreground title-underline-gold mb-4">{language === 'ar' ? 'اكتشف المزيد' : 'More to explore'}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {relatedProducts?.map((p) => <ProductCard key={p.id} product={p} variant="compact" />)}
                {recentlyViewedProducts?.filter((p) => !relatedProducts?.some((r) => r.id === p.id)).map((p) => <ProductCard key={p.id} product={p} variant="compact" />)}
              </div>
            </div>
          ) : null}

          {/* Reviews — rating summary; stacked mobile, row sm+; RTL-aware; 0 = no rating yet */}
          <div className="mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-xl font-bold text-foreground title-underline-gold mb-3">{language === 'ar' ? 'التقييمات' : 'Reviews'}</h2>
            <div
              className={cn(
                'flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-lg',
                'p-3 min-[375px]:p-4 sm:p-5 lg:p-6 rounded-xl border border-border bg-card/50',
                'text-center sm:text-start'
              )}
            >
              <div className="h-12 w-12 min-[375px]:h-14 min-[375px]:w-14 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span
                  className={cn(
                    'text-lg sm:text-xl lg:text-2xl font-bold tabular-nums',
                    product.rating > 0 ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {product.rating > 0 ? product.rating.toFixed(1) : '0.0'}
                </span>
              </div>
              <div className="min-w-0 flex flex-col items-center sm:items-start">
                <div className="flex gap-0.5 text-primary justify-center sm:justify-start" aria-label={product.rating > 0 ? `${product.rating} out of 5` : 'No ratings yet'}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={cn('h-4 w-4 min-[375px]:h-5 min-[375px]:w-5 shrink-0', i <= Math.round(product.rating) ? 'fill-primary text-primary' : 'text-muted-foreground/40')}
                      aria-hidden
                    />
                  ))}
                </div>
                <p className="text-[0.75rem] sm:text-sm text-muted-foreground mt-1">
                  {product.ratingCount === 0
                    ? (language === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet')
                    : `${product.ratingCount} ${language === 'ar' ? 'تقييم' : 'reviews'}`}
                </p>
                {product.ratingCount === 0 && (
                  <p className="text-foreground/90 mt-1.5 text-sm font-medium">{language === 'ar' ? 'كن أول من يقيّم' : 'Be the first to review'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProductDetailPage
