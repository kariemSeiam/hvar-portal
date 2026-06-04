import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '@/contexts/LanguageContext'
import { ApplianceDoodleBg } from '@/components/customer/ApplianceDoodleBg'
import { useAuth } from '@/contexts/AuthContext'
import { favoritesApi } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageBreadcrumb } from '@/components/customer/PageBreadcrumb'
import { CustomerEmptyState } from '@/components/customer/CustomerEmptyState'
import { ProductCard } from '@/components/customer/ProductCard'
import type { Product } from '@/types'
import { Heart } from 'lucide-react'

const SKELETON_DELAY_MS = 200

const WishlistPage = () => {
  const { t, language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const [showSkeleton, setShowSkeleton] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => favoritesApi.getAll({ page: 1, perPage: 50 }),
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (!isLoading) {
      setShowSkeleton(false)
      return
    }
    const id = window.setTimeout(() => setShowSkeleton(true), SKELETON_DELAY_MS)
    return () => clearTimeout(id)
  }, [isLoading])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const rawProducts = data?.items ?? []
  const products: Product[] = rawProducts.map((p) => ({ ...p, isFavorite: true }))
  const isRTL = language === 'ar'

  return (
    <div className="wishlist-page relative min-h-screen bg-transparent" dir={isRTL ? 'rtl' : 'ltr'}>
      <ApplianceDoodleBg className="z-0" opacity={0.2} variant="mix" />
      <PageBreadcrumb
        dir={isRTL ? 'rtl' : 'ltr'}
        containerClassName="container-wide"
        ariaLabel={language === 'ar' ? 'مسار الصفحة' : 'Breadcrumb'}
        items={[
          { label: t('nav.home'), href: '/' },
          { label: t('wishlist.title') },
        ]}
      />
      <section aria-label={t('wishlist.title')}>
        <div className="container-wide pt-2 pb-32 sm:pt-3 sm:pb-8">
          <header
            className="section-header-bar w-full min-w-0 flex flex-row flex-nowrap items-center gap-2 sm:gap-3 pb-5 sm:pb-6"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div
              className="section-header-icon flex items-center justify-center rounded-lg sm:rounded-xl overflow-visible ring-1 ring-primary/25 bg-primary/10 [&_svg]:text-primary"
              aria-hidden
            >
              <Heart className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1 className={`section-header-title font-bold text-foreground title-underline-gold w-full min-w-0 tracking-tight block ${language === 'ar' ? 'font-cairo font-extrabold' : ''}`}>
                {t('wishlist.title')}
              </h1>
              <p className="hidden text-sm text-muted-foreground font-tajawal leading-relaxed max-w-2xl mt-0.5 sm:block">
                {t('wishlist.subtitle')}
              </p>
            </div>
          </header>

          {isLoading && !showSkeleton ? null : isLoading && showSkeleton ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-1/3 rounded-full" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <CustomerEmptyState
              variant="subsection"
              dir={isRTL ? 'rtl' : 'ltr'}
              icon={<Heart className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden />}
              title={t('wishlist.empty')}
              description={
                language === 'ar'
                  ? 'أضف منتجات للمفضلة لتسهيل العثور عليها لاحقاً'
                  : 'Add products to your wishlist to find them easily later'
              }
              action={
                <>
                  <Button asChild className="cta-primary min-h-[44px]">
                    <Link to="/products">{t('nav.products')}</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-6 max-w-xs text-center">
                    {t('common.trustLine')}
                  </p>
                </>
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} variant="grid" />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default WishlistPage
