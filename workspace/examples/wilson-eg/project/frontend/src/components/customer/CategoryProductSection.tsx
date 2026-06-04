/**
 * CategoryProductSection — Wilson Egypt
 * Full recreation: web + mobile, Egyptian Gold vision, editorial section treatment.
 * Header: icon badge + title + subtitle | View All pill. Layouts: vertical grid / horizontal scroll.
 */
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import { ProductCard } from './ProductCard'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface CategoryProductSectionProps {
  categoryKey: string
  nameAr: string
  nameEn: string
  products: Product[]
  layout: 'vertical' | 'horizontal'
  variant?: 'default' | 'muted' | 'alt' | 'dark'
  /** When 'compact', uses reduced vertical padding (for stacked sections). Default = full section padding. */
  spacing?: 'default' | 'compact'
  /** When true, reduces top padding only (e.g. first section after page hero). Keeps normal bottom padding. */
  tightTop?: boolean
  /** When 'detailed', vertical layout uses larger, more descriptive cards (single-category showroom). */
  cardVariant?: 'grid' | 'detailed'
  icon?: React.ReactNode
}

const VIEW_ALL = { ar: 'عرض الكل', en: 'View all' }

export function CategoryProductSection({
  categoryKey,
  nameAr,
  nameEn,
  products,
  layout,
  variant = 'default',
  spacing = 'default',
  tightTop = false,
  cardVariant = 'grid',
  icon,
}: CategoryProductSectionProps) {
  const { language } = useLanguage()
  const { theme } = useTheme()
  const name = language === 'ar' ? nameAr : nameEn
  const viewAllText = language === 'ar' ? VIEW_ALL.ar : VIEW_ALL.en
  const isRTL = language === 'ar'

  if (products.length === 0) return null

  const sectionStyles = {
    default: 'section-creative-warm relative',
    muted: 'section-creative-accent relative',
    alt: 'section-alt-vision',
    dark: 'cta-vision relative',
  }[variant]

  const isDarkVariant = variant === 'dark'
  const isDarkTheme = theme === 'dark'
  const useHeroColors = isDarkVariant && isDarkTheme

  const headerTextClass = useHeroColors ? 'text-[hsl(var(--hero-text))]' : 'text-foreground'
  const iconWrapperClass = useHeroColors
    ? 'ring-2 ring-[hsl(var(--hero-accent)/0.4)] bg-[hsl(var(--hero-bg)/0.6)] [&_svg]:text-[hsl(var(--hero-accent))]'
    : 'ring-1 ring-primary/25 bg-primary/10 [&_svg]:text-primary'

  /* View all — ghost link: no background/border, gold text, 44px touch (Wilson tertiary) */
  const viewAllBase =
    'inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-200 min-h-[44px] touch-manipulation rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]'
  const viewAllTheme = useHeroColors
    ? 'text-[hsl(var(--hero-accent))] hover:opacity-90 focus-visible:ring-[hsl(var(--hero-accent))]'
    : 'text-primary hover:text-primary/90 focus-visible:ring-primary'

  const paddingClass =
    spacing === 'compact'
      ? 'py-8 sm:py-10 md:py-12'
      : tightTop
        ? 'pt-6 sm:pt-8 lg:pt-10 pb-16 sm:pb-20 lg:pb-24'
        : 'section-padding'

  return (
    <section
      id={`section-category-${categoryKey}`}
      className={cn(paddingClass, 'relative overflow-hidden', sectionStyles)}
      aria-labelledby={`category-${categoryKey}-heading`}
    >
      <div className="container-wide w-full max-w-full min-w-0 relative z-10">
        {/* Header — full-width bar, responsive on all devices; title truncates, View all always visible */}
        <header
          className="section-header-bar w-full min-w-0 flex flex-row flex-nowrap items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="min-w-0 flex-1 flex flex-row flex-nowrap items-center gap-2 sm:gap-3">
            {icon != null && (
              <div
                className={cn(
                  'section-header-icon flex flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl overflow-visible',
                  'w-9 h-9 sm:w-10 sm:h-10 [&_svg]:h-5 [&_svg]:w-5 sm:[&_svg]:h-6 sm:[&_svg]:w-6',
                  iconWrapperClass
                )}
                aria-hidden
              >
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1 overflow-hidden">
              <h2
                id={`category-${categoryKey}-heading`}
                className={cn(
                  'section-header-title font-bold title-underline-gold w-full min-w-0 tracking-tight truncate block',
                  headerTextClass
                )}
                title={name}
              >
                {name}
              </h2>
            </div>
          </div>

          <Link
            to={`/products?category=${categoryKey}`}
            className={cn(viewAllBase, viewAllTheme, 'group/btn flex-shrink-0 whitespace-nowrap')}
            aria-label={viewAllText}
          >
            <span>{viewAllText}</span>
            {/* AR: arrow at end (left); EN: arrow at end (right). Same order, rotation for direction. */}
            <ArrowLeft
              className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-200',
                isRTL ? 'group-hover/btn:translate-x-0.5' : 'rotate-180 group-hover/btn:-translate-x-0.5'
              )}
              aria-hidden
            />
          </Link>
        </header>

        {layout === 'vertical' ? (
          <div
            className={cn(
              'grid gap-3 sm:gap-4 lg:gap-5',
              cardVariant === 'detailed'
                ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4'
            )}
          >
            {products.map((product, i) => (
              <div
                key={product.id}
                className={cn(
                  'animate-fade-in-up min-h-0 h-full',
                  i % 2 === 1 && 'pill-tilt'
                )}
                style={{ animationDelay: `${Math.min(i * 0.06, 0.3)}s`, animationFillMode: 'both' }}
              >
                <ProductCard product={product} variant={cardVariant === 'detailed' ? 'detailed' : 'grid'} />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="space-y-4"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div
              className={cn(
                'h-0.5 w-20 sm:w-24 rounded-full',
                useHeroColors
                  ? 'bg-gradient-to-r from-[hsl(var(--hero-accent))] to-[hsl(var(--hero-accent)/0.4)] rtl:bg-gradient-to-l rtl:from-[hsl(var(--hero-accent))] rtl:to-[hsl(var(--hero-accent)/0.4)]'
                  : 'bg-gradient-to-r from-primary to-primary/40 rtl:bg-gradient-to-l rtl:from-primary rtl:to-primary/40'
              )}
              aria-hidden
            />
            <div
              className={cn(
                'overflow-x-auto scrollbar-hide pb-6 snap-x snap-mandatory scroll-smooth category-scroll-touch',
                '-mx-4 sm:-mx-6 lg:-mx-8',
                'ps-4 sm:ps-6 lg:ps-8'
              )}
            >
              <div className="flex gap-3 sm:gap-4 lg:gap-5 min-w-max w-max">
                {products.map((product, i) => (
                  <div
                    key={product.id}
                    className={cn(
                      'flex-shrink-0 w-[min(100vw-2rem,260px)] min-[480px]:w-[280px] sm:w-[300px] md:w-[320px] snap-center',
                      i % 2 === 1 && 'pill-tilt'
                    )}
                  >
                    <ProductCard product={product} variant="compact" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
