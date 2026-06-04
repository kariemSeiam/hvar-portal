/**
 * ProductsPage — Wilson Egypt spec
 * Creative layouts: single category = vertical or horizontal by category; all products = grouped sections with alternating layouts.
 */
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '@/contexts/LanguageContext'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { productsApi } from '@/services/api'
import { CategoryProductSection } from '@/components/customer/CategoryProductSection'
import { CategoryIcon } from '@/components/icons/CategoryIcons'
import { useCategories } from '@/hooks/useCategories'
import type { Product } from '@/types'

function groupByCategory(products: Product[]): Array<{ category: string; products: Product[] }> {
  const map = new Map<string, Product[]>()
  for (const p of products) {
    const key = p.category || 'other'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return Array.from(map.entries()).map(([category, products]) => ({ category, products }))
}

const ProductsPage = () => {
  const { t, language } = useLanguage()
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category') || undefined
  const search = searchParams.get('search') || undefined
  const { data: categories = [] } = useCategories()
  const currentCategory = category ? categories.find((c) => c.slug === category) : null
  const categoryTitle = currentCategory
    ? (language === 'ar' ? currentCategory.nameAr : currentCategory.nameEn)
    : null

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', category, search],
    queryFn: () =>
      productsApi.getAll({
        category,
        search,
        page: 1,
        limit: 48,
      }),
  })

  const products = data?.items ?? []

  const pageTitle = search
    ? (language === 'ar' ? `نتائج البحث: "${search}"` : `Search: "${search}"`)
    : category
      ? (categoryTitle ?? category)
      : t('products.all')
  const pageSubtitle =
    language === 'ar' ? 'اكتشف جميع منتجاتنا — جودة ويلسون وضمان أصلي' : 'Discover all our products — Wilson quality and original warranty'

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      {/* Breadcrumb — same container as hero, responsive padding */}
      <div className="w-full py-3 sm:py-3.5">
        <div className="container-wide w-full max-w-full min-w-0">
          <nav className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap min-w-0" aria-label={language === 'ar' ? 'مسار الصفحة' : 'Breadcrumb'}>
            <Link to="/" className="hover:text-primary transition-colors shrink-0">{t('nav.home')}</Link>
            <span aria-hidden className="shrink-0">/</span>
            {search ? (
              <>
                <Link to="/products" className="hover:text-primary transition-colors shrink-0">{t('products.category')}</Link>
                <span aria-hidden className="shrink-0">/</span>
                <span className="text-foreground font-medium truncate max-w-full" aria-current="page" style={{ minWidth: 0 }}>{language === 'ar' ? 'بحث' : 'Search'}</span>
              </>
            ) : category ? (
              <>
                <Link to="/products" className="hover:text-primary transition-colors truncate min-w-0 max-w-full" style={{ minWidth: 0 }}>{t('products.category')}</Link>
                <span aria-hidden className="shrink-0">/</span>
                <span className="text-foreground font-medium truncate max-w-full" aria-current="page" style={{ minWidth: 0 }}>{categoryTitle ?? category}</span>
              </>
            ) : (
              <span className="text-foreground font-medium" aria-current="page">{t('products.all')}</span>
            )}
          </nav>
        </div>
      </div>

      {/* Products hero — responsive padding (products-hero), no overflow */}
      <section className="page-hero-vision products-hero overflow-hidden w-full">
        <div className="container-wide w-full max-w-full min-w-0">
          <h1 className="text-h1 font-bold text-foreground title-underline-gold w-full text-start block mb-3 sm:mb-4 break-words">
            {pageTitle}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mb-5 sm:mb-6 md:mb-8 text-start break-words leading-relaxed">
            {pageSubtitle}
          </p>

          {/* Category strip — responsive gap + wrap */}
          <nav className="products-category-strip" aria-label={language === 'ar' ? 'التصنيفات' : 'Categories'}>
            <Link
              to="/products"
              className={!category ? '!border-primary !bg-primary/10 !text-primary' : ''}
            >
              {t('products.all')}
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                to={`/products?category=${c.slug}`}
                className={category === c.slug ? '!border-primary !bg-primary/10 !text-primary' : ''}
              >
                {language === 'ar' ? c.nameAr : c.nameEn}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {isLoading ? (
        <section className="section-padding section-creative-warm">
          <div className="container-wide">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex flex-col min-h-0">
                  <Skeleton className="aspect-square rounded-xl w-full" />
                  <Skeleton className="h-3.5 w-3/4 mt-2 sm:mt-3" />
                  <Skeleton className="h-3.5 w-1/2 mt-1" />
                  <Skeleton className="h-5 w-1/3 mt-2 sm:mt-2.5" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : error ? (
        <section className="section-padding section-creative-accent">
          <div className="container-wide text-center py-12">
            <p className="text-destructive mb-4">
              {language === 'ar' ? 'حدث خطأ في تحميل المنتجات' : 'Failed to load products'}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </div>
        </section>
      ) : products.length === 0 ? (
        <section className="section-padding section-creative-accent">
          <div className="container-wide text-center py-16 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Search className="h-8 w-8 text-primary/80" strokeWidth={1.5} aria-hidden />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2 title-underline-gold title-underline-gold-center">
              {language === 'ar' ? 'لم نجد منتجات تطابق بحثك' : 'No products match your search'}
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {language === 'ar'
                ? 'جرب تصنيفاً آخر أو تصفح كل المنتجات — جودة ويلسون وضمان أصلي.'
                : 'Try another category or browse all products — Wilson quality and original warranty.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild className="cta-primary min-h-[44px]">
                <Link to="/products">{language === 'ar' ? 'عرض كل المنتجات' : 'View all products'}</Link>
              </Button>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-foreground hover:text-primary bg-transparent min-h-[44px] px-4 py-2.5 text-sm"
              >
                {language === 'ar' ? 'الرئيسية' : 'Home'}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        /* Creative layout: category sections */
        <>
          {category ? (
            <CategoryProductSection
              categoryKey={category}
              nameAr={currentCategory?.nameAr ?? category}
              nameEn={currentCategory?.nameEn ?? category}
              products={products}
              layout="vertical"
              variant="default"
              cardVariant="detailed"
              tightTop
              icon={<CategoryIcon categoryKey={category} size={32} />}
            />
          ) : (
            groupByCategory(products).map(({ category: catKey, products: catProducts }, idx) => {
              const catFromApi = categories.find((c) => c.slug === catKey)
              const layout: 'vertical' | 'horizontal' = idx % 2 === 0 ? 'vertical' : 'horizontal'
              const variant: 'default' | 'muted' | 'alt' | 'dark' =
                idx % 4 === 0 ? 'default' : idx % 4 === 1 ? 'muted' : idx % 4 === 2 ? 'alt' : 'dark'
              return (
                <CategoryProductSection
                  key={catKey}
                  categoryKey={catKey}
                  nameAr={catFromApi?.nameAr ?? catKey}
                  nameEn={catFromApi?.nameEn ?? catKey}
                  products={catProducts}
                  layout={layout}
                  variant={variant}
                  spacing="compact"
                  icon={<CategoryIcon categoryKey={catKey} size={32} />}
                />
              )
            })
          )}
        </>
      )}
    </div>
  )
}

export default ProductsPage
