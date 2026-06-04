/**
 * ProductCard — Wilson Egypt spec
 * Responsive: all devices/screens. Image aspect-ratio 1, one badge max, 44px touch, uniform height in grids.
 * On image: Fav (top-end), one badge (top-start). Price + cart icon at end of bar; text only on click (أضيف/Added).
 * 
 * Mobile refactor: tighter positioning, smaller badge font, no overlap between badge and heart.
 */
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingCart, Bell, ImageOff, Star, Heart, Check } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCategories } from '@/hooks/useCategories'
import { favoritesApi } from '@/services/api'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  variant?: 'grid' | 'list' | 'compact' | 'detailed'
}

export function ProductCard({ product, variant = 'grid' }: ProductCardProps) {
  const { language } = useLanguage()
  const { data: categories = [] } = useCategories()
  const categoryFromApi = product.category ? categories.find((c) => c.slug === product.category) : null
  const categoryLabel = categoryFromApi
    ? (language === 'ar' ? categoryFromApi.nameAr : categoryFromApi.nameEn)
    : (product.category ?? '')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const { addItem, isInCart, getItemQuantity } = useCart()
  const [isFav, setIsFav] = useState(product.isFavorite ?? false)
  const [justAdded, setJustAdded] = useState(false)
  const [titleExpanded, setTitleExpanded] = useState(false)
  const [titleClamped, setTitleClamped] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const name = language === 'ar' ? product.nameAr : product.nameEn

  useEffect(() => {
    let raf = 0
    let ro: ResizeObserver | null = null
    raf = requestAnimationFrame(() => {
      const el = titleRef.current
      if (!el) return
      const check = () => {
        const overflow = el.scrollHeight - el.clientHeight
        setTitleClamped(overflow > 4)
      }
      check()
      ro = new ResizeObserver(check)
      ro.observe(el)
    })
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  }, [name, titleExpanded])

  useEffect(() => {
    setIsFav(product.isFavorite ?? false)
  }, [product.isFavorite])
  useEffect(() => {
    if (!justAdded) return
    const t = setTimeout(() => setJustAdded(false), 1800)
    return () => clearTimeout(t)
  }, [justAdded])

  const price = product.discountPrice ?? product.basePrice
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.basePrice
  const inCart = isInCart(product.id)
  const cartQty = getItemQuantity(product.id)

  const favMutation = useMutation({
    mutationFn: () => favoritesApi.toggle(product.id),
    onMutate: () => setIsFav((prev) => !prev),
    onError: () => setIsFav(product.isFavorite ?? false),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['favorite-status', product.id] })
    },
  })

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product.inStock) return
    addItem(product, 1)
    setJustAdded(true)
  }

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    favMutation.mutate()
  }

  const isList = variant === 'list'
  const isCompact = variant === 'compact'
  const isDetailed = variant === 'detailed'
  const saleLabel = language === 'ar' ? 'عرض' : 'Sale'
  const showTag = product.tag?.trim() && product.tag.trim() !== saleLabel

  const addToCartLabel = language === 'ar' ? 'أضف للسلة' : 'Add to cart'

  return (
    <Link
      to={`/products/${product.sku}`}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 h-full min-h-0',
        'hover:border-primary/50 hover:shadow-[0_0_25px_5px_hsl(var(--primary)/0.15)] hover:-translate-y-0.5',
        !isList && 'product-card-creative',
        isList && 'flex-row p-3 sm:p-4 gap-3 sm:gap-4',
        variant === 'grid' && 'p-2 min-[375px]:p-2.5 sm:p-4',
        isCompact && 'p-2 min-[375px]:p-2.5',
        isDetailed && 'p-4 sm:p-5 md:p-6'
      )}
    >
      {/* Image: aspect-square everywhere for uniform grid height; fav top-end, one badge top-start. */}
      <div className={cn(
        'relative w-full flex-shrink-0',
        isList && 'w-24 min-[375px]:w-28 sm:w-32 shrink-0',
        !isList && 'aspect-square',
        variant === 'grid' && 'mb-1.5 min-[375px]:mb-2 sm:mb-3',
        isCompact && 'mb-1.5 min-[375px]:mb-2',
        isDetailed && 'mb-3 sm:mb-4'
      )}>
        <div
          className={cn(
            'aspect-square rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden min-h-0 w-full',
            isList && 'rounded-lg max-h-[96px] min-[375px]:max-h-[112px] sm:max-h-[128px]'
          )}
        >
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={name}
              loading="lazy"
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ImageOff className={cn('text-muted-foreground/60', isDetailed ? 'h-12 w-12 min-[375px]:h-16 sm:h-20 sm:w-20' : 'h-10 w-10 min-[375px]:h-12 sm:h-14 sm:w-14')} aria-hidden />
          )}
        </div>

        {/* Badge at start (RTL: right, LTR: left) */}
        {(() => {
          const badgeClass = (extra: string) => cn(
            'rounded font-semibold leading-tight',
            'text-[0.65rem] px-1.5 py-0.5',
            'min-[375px]:text-[0.7rem] min-[375px]:px-2 min-[375px]:py-0.5',
            'sm:text-xs sm:px-2.5 sm:py-1',
            (variant === 'grid' || isCompact || isList) ? '' : 'rounded-lg px-2.5 py-1 text-xs sm:text-sm',
            extra
          )
          const oneBadge =
            hasDiscount
              ? <span key="sale" className={badgeClass('bg-primary/95 font-bold uppercase tracking-wide text-primary-foreground shadow-[0_1px_6px_hsl(var(--primary)/0.3)]')}>{saleLabel}</span>
              : showTag
                ? <span key="tag" dir="auto" className={cn(badgeClass('text-white shadow-[0_1px_6px_rgba(0,0,0/0.15)]'), !product.tagColor && 'bg-success/95')} style={product.tagColor ? { backgroundColor: product.tagColor } : undefined}>{product.tag!.trim()}</span>
                : (product.warrantyYears != null && product.warrantyYears > 0)
                  ? <span key="warranty" className={badgeClass('border border-primary/50 bg-primary/20 text-primary')} title={language === 'ar' ? 'ضمان أصلي ويلسون' : 'Wilson original warranty'}>{language === 'ar' ? `ضمان ${product.warrantyYears} سنة` : `${product.warrantyYears}yr`}</span>
                  : null
          if (!oneBadge) return null
          return (
            <div className={cn(
              'absolute z-10',
              'top-1 start-1 min-[375px]:top-1.5 min-[375px]:start-1.5 sm:top-2 sm:start-2'
            )}>
              {oneBadge}
            </div>
          )
        })()}

        {/* Heart at end (RTL: left, LTR: right) — icon only, 44px touch minimum */}
        <button
          type="button"
          onClick={handleFav}
          aria-label={isFav ? (language === 'ar' ? 'إزالة من المفضلة' : 'Remove from favorites') : (language === 'ar' ? 'إضافة للمفضلة' : 'Add to favorites')}
          className={cn(
            'absolute z-20 flex items-center justify-center transition-all duration-200 touch-manipulation',
            'top-1 end-1 min-[375px]:top-1.5 min-[375px]:end-1.5 sm:top-2 sm:end-2',
            isCompact
              ? 'min-h-[36px] min-w-[36px] min-[375px]:min-h-[44px] min-[375px]:min-w-[44px]'
              : 'min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px]',
            isFav
              ? 'text-primary'
              : 'text-muted-foreground/70 hover:text-primary',
            'hover:scale-110 active:scale-95'
          )}
        >
          <Heart className={cn(
            'shrink-0',
            'h-4 w-4 min-[375px]:h-[1.125rem] min-[375px]:w-[1.125rem] sm:h-5 sm:w-5',
            isFav && 'fill-primary'
          )} />
        </button>
      </div>

      <div className={cn('relative flex-1 flex flex-col min-h-0', isList && 'min-w-0')}>
        {(!isCompact || isDetailed) && (
          <p className={cn(
            'font-medium text-muted-foreground uppercase tracking-wide',
            isDetailed ? 'text-xs sm:text-sm' : 'text-[0.65rem] min-[375px]:text-xs'
          )}>
            {categoryLabel}
          </p>
        )}

        <div className="min-w-0">
          <h3
            ref={titleRef}
            className={cn(
              'font-semibold text-foreground',
              !titleExpanded && 'line-clamp-2',
              (variant === 'grid' || isCompact) && 'text-xs min-[375px]:text-sm',
              isDetailed && 'text-base sm:text-lg mt-0.5'
            )}
          >
            {name}
          </h3>
          {titleClamped && (variant === 'grid' || isCompact) && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTitleExpanded((v) => !v); }}
              className="mt-0.5 text-[0.65rem] min-[375px]:text-[0.75rem] font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded touch-manipulation min-h-[32px] min-[375px]:min-h-touch inline-flex items-center"
              aria-expanded={titleExpanded}
            >
              {titleExpanded ? (language === 'ar' ? 'عرض أقل' : 'Show less') : (language === 'ar' ? 'عرض المزيد' : 'Show more')}
            </button>
          )}
        </div>

        {product.sku && (
          <p className={cn(
            'text-muted-foreground font-variant-numeric tabular-nums',
            isDetailed ? 'text-sm' : 'text-[0.65rem] min-[375px]:text-xs'
          )}>
            {product.sku}
          </p>
        )}

        {(!isCompact || isDetailed) && variant !== 'grid' &&
          (product.specifications?.capacity ||
            product.specifications?.warranty ||
            product.warrantyYears) && (
            <p className="text-xs text-muted-foreground">
              {[
                product.specifications?.capacity,
                product.specifications?.warranty ??
                  (product.warrantyYears
                    ? language === 'ar'
                      ? `ضمان ${product.warrantyYears} سنوات`
                      : `${product.warrantyYears} yr warranty`
                    : null),
              ]
                .filter(Boolean)
                .join(' • ')}
            </p>
          )}

        {/* Detailed: key specs (power, dimensions, material, color) + energy rating */}
        {isDetailed && product.specifications && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {[
              product.specifications.power,
              product.specifications.dimensions,
              product.specifications.material,
              product.specifications.color,
              product.energyRating ? (language === 'ar' ? `كفاءة ${product.energyRating}` : `Energy ${product.energyRating}`) : null,
            ]
              .filter(Boolean)
              .join(' • ')}
          </p>
        )}

        {product.rating > 0 && (!isCompact || isDetailed) && variant !== 'grid' && (
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="h-4 w-4 fill-primary text-primary shrink-0" aria-hidden />
            <span className="text-foreground font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({product.ratingCount})</span>
          </div>
        )}

        {/* Price + CTA bar — single row, no wrap. Responsive gap/size 320px → desktop. */}
        <div
          className={cn(
            'flex items-center justify-between min-w-0 w-full mt-auto',
            (variant === 'grid' || isCompact) ? 'gap-1.5 min-[375px]:gap-2 sm:gap-3 pt-2 min-[375px]:pt-2.5 sm:pt-3' : 'gap-3 sm:gap-4 pt-3 sm:pt-4'
          )}
        >
          <div className="min-w-0 flex flex-col gap-0.5 shrink" dir="ltr">
            {hasDiscount && (
              <span className="text-[0.65rem] min-[375px]:text-[0.75rem] sm:text-sm text-muted-foreground line-through font-variant-numeric tabular-nums" style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
                {product.basePrice.toLocaleString()} ج.م
              </span>
            )}
            <span
              className={cn(
                'font-bold text-primary font-variant-numeric tabular-nums truncate',
                (variant === 'grid' || isCompact) && 'text-xs min-[375px]:text-sm sm:text-base',
                !(variant === 'grid' || isCompact) && 'text-base sm:text-lg',
                isDetailed && 'text-lg sm:text-xl'
              )}
              style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}
            >
              {price.toLocaleString()} ج.م
            </span>
          </div>
          <div className="shrink-0 flex items-center">
            {product.inStock ? (
              inCart ? (
                <div
                  className={cn(
                    'relative flex items-center justify-center rounded-lg min-[375px]:rounded-xl border border-primary bg-primary/10 text-primary touch-manipulation',
                    'min-h-[40px] min-w-[40px] w-10 h-10',
                    'min-[375px]:min-h-[44px] min-[375px]:min-w-[44px] min-[375px]:w-11 min-[375px]:h-11',
                    'sm:min-h-[44px] sm:min-w-[44px]',
                    isDetailed && 'w-11 h-11 sm:w-12 sm:h-12'
                  )}
                  title={language === 'ar' ? `في السلة (${cartQty})` : `In Cart (${cartQty})`}
                >
                  <ShoppingCart className={cn('h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4 sm:h-5 sm:w-5')} />
                  <span className="absolute -top-0.5 -end-0.5 flex h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4 items-center justify-center rounded-full bg-primary text-[0.6rem] min-[375px]:text-[0.65rem] font-bold text-primary-foreground min-w-[14px] min-[375px]:min-w-[16px] leading-none">
                    {cartQty}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-lg min-[375px]:rounded-xl border border-primary bg-primary/5 text-primary touch-manipulation overflow-hidden transition-all duration-200 ease-out',
                    'hover:bg-primary hover:text-primary-foreground hover:shadow-[0_4px_12px_hsl(var(--primary)/0.25)] hover:-translate-y-0.5',
                    'active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                    // Mobile base
                    (variant === 'grid' || isCompact) && 'min-h-[40px] min-w-[40px] w-10 h-10',
                    // 375px+
                    (variant === 'grid' || isCompact) && 'min-[375px]:min-h-[44px] min-[375px]:min-w-[44px] min-[375px]:w-11 min-[375px]:h-11',
                    // Just added state
                    (variant === 'grid' || isCompact) && justAdded && '!min-w-0 !w-auto max-w-[5rem] min-[375px]:max-w-[6rem] px-1.5 min-[375px]:px-2',
                    isDetailed && 'h-11 min-h-11 sm:h-12 sm:min-h-12 px-4'
                  )}
                  aria-label={addToCartLabel}
                  title={addToCartLabel}
                >
                  {justAdded ? (
                    <Check className={cn('h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4 sm:h-4 sm:w-4 shrink-0 product-card-added-check')} aria-hidden />
                  ) : (
                    <ShoppingCart className={cn('h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4 sm:h-4 sm:w-4 shrink-0')} />
                  )}
                  {((variant === 'grid' || isCompact) && justAdded) || isDetailed ? (
                    <span className="font-semibold text-[0.65rem] min-[375px]:text-[0.75rem] sm:text-sm whitespace-nowrap overflow-hidden max-w-[3rem] min-[375px]:max-w-[4rem] sm:max-w-[5rem]">
                      {justAdded ? (language === 'ar' ? 'أضيف' : 'Added') : addToCartLabel}
                    </span>
                  ) : null}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className={cn(
                  'inline-flex items-center justify-center rounded-full border-2 border-border text-muted-foreground touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                  'min-h-[40px] min-w-[40px] w-10 h-10',
                  'min-[375px]:min-h-[44px] min-[375px]:min-w-[44px] min-[375px]:w-11 min-[375px]:h-11'
                )}
                aria-label={language === 'ar' ? 'أخبرني عند التوفر' : 'Notify Me'}
              >
                <Bell className="h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4 sm:h-5 sm:w-5 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
