import { Link, useLocation } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronDown, Shield, Truck, Clock, Users, Wrench, Percent } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ApplianceDoodleBg } from '@/components/customer/ApplianceDoodleBg'
import { CategoryProductSection } from '@/components/customer/CategoryProductSection'
import { CategoryIcon } from '@/components/icons/CategoryIcons'
import { WilsonLogo } from '@/components/layout/WilsonLogo'
import { useInView, staggerDelay } from '@/hooks/useInView'
import { useCategories } from '@/hooks/useCategories'
import { productsApi, slidesApi, getUploadImageSrc } from '@/services/api'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Inline fallback when no backend slides — avoids 404 if public/hero/ images missing */
const HERO_FALLBACK_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FEB636'/%3E%3Cstop offset='100%25' style='stop-color:%23f5e6c8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23g)'/%3E%3C/svg%3E"

const HomePage = () => {
  const { t, language } = useLanguage()
  const { pathname } = useLocation()
  const fontFamily = language === 'ar' ? 'Cairo, Tajawal, sans-serif' : 'Inter, sans-serif'
  const fontDisplay = language === 'ar' ? 'Cairo, Tajawal, sans-serif' : '"Playfair Display", Georgia, serif'
  const { data: categoriesFromApi = [] } = useCategories()
  const categoriesWithProducts = useMemo(
    () => categoriesFromApi.filter((c) => (c.productCount ?? 0) > 0),
    [categoriesFromApi]
  )

  const socialProof = [
    { icon: Shield, label: t('proof.warranty') },
    { icon: Clock, label: t('proof.service') },
    { icon: Percent, label: t('proof.interest') },
    { icon: Users, label: t('proof.customers') },
    { icon: Truck, label: t('proof.delivery') },
    { icon: Wrench, label: t('proof.installation') },
  ]

  const pillars = [
    { title: t('why.pillar1.title'), desc: t('why.pillar1.desc') },
    { title: t('why.pillar2.title'), desc: t('why.pillar2.desc') },
    { title: t('why.pillar3.title'), desc: t('why.pillar3.desc') },
  ]

  const categoryQueries = useQueries({
    queries: categoriesWithProducts.map((cat) => ({
      queryKey: ['category-products', cat.slug],
      queryFn: () => productsApi.getByCategory(cat.slug, { limit: 6 }),
    })),
  })

  const { data: slides = [], isLoading: slidesLoading } = useQuery({
    queryKey: ['slides'],
    queryFn: () => slidesApi.getSlides(),
    staleTime: 5 * 60 * 1000,
  })

  // Backend-first: use admin slides when loaded; fallback to inline placeholder when no slides (no 404)
  const heroSources = slidesLoading
    ? [{ id: 'loading', src: HERO_FALLBACK_SRC, alt: '', productSku: undefined as string | undefined }]
    : slides.length > 0
      ? slides.map((s) => ({
          id: s.id,
          src: getUploadImageSrc(s.imageUrl),
          alt: s.title,
          productSku: s.product?.code?.trim() || undefined,
        }))
      : [{ id: 'fallback', src: HERO_FALLBACK_SRC, alt: '', productSku: undefined as string | undefined }]

  // Scroll-triggered section refs
  const cats = useInView<HTMLElement>({ threshold: 0.1 })
  const whySection = useInView<HTMLElement>({ threshold: 0.15 })
  const ctaSection = useInView<HTMLElement>({ threshold: 0.2 })

  // Hero viewport: single frame, auto-rotate (respects reduced motion)
  const [heroViewportIndex, setHeroViewportIndex] = useState(0)
  const goNext = useCallback(() => {
    if (heroSources.length === 0) return
    setHeroViewportIndex((i) => (i + 1) % heroSources.length)
  }, [heroSources.length])
  useEffect(() => {
    if (prefersReducedMotion() || heroSources.length <= 1) return
    const t = setInterval(goNext, 5200)
    return () => clearInterval(t)
  }, [goNext, heroSources.length])

  return (
    <div>
      {/* Hero — Wilson UX + Design: brand identity in 3s, ONE CTA, gold art, display typography */}
      <section
        className="hero-wilson gold-mesh-hero flex items-center"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        aria-label={t('hero.title')}
      >
        <ApplianceDoodleBg
          className="z-0"
          opacity={0.24}
          variant="mix"
          animated
        />
        <div className="hero-wilson-content w-full flex items-center min-h-0">
          <div className="hero-wilson-inner container-wide w-full">
            <div className="hero-wilson-grid">
              {/* Hero copy — typography + spacing from CSS vars */}
              <div className="hero-copy">
                {/* Logo */}
                <div
                  className="flex flex-col items-center md:items-start w-full max-w-xl m-0 p-0 hero-art-in [&_svg]:ms-0 [&_svg]:p-0 sm:[&_svg]:-ms-12 md:[&_svg]:-ms-[106px]"
                  style={{ animationDelay: '0s', margin: 0, padding: 0 }}
                >
                  <WilsonLogo
                    size="hero"
                    variant="hero"
                    className="max-w-[26rem] sm:max-w-[32rem] lg:max-w-[36rem]"
                    style={{ height: 'var(--hero-fs-logo)', margin: 0, padding: 0 }}
                  />
                </div>

                {/* Headline — display font (EN) / Cairo (AR) */}
                <h1
                  className="text-[hsl(var(--hero-accent))] font-extrabold tracking-tight leading-[1.2] hero-art-in max-w-md mx-0"
                  style={{
                    marginTop: 'var(--hero-gap-logo-headline)',
                    animationDelay: '0.08s',
                    fontFamily: fontDisplay,
                    fontSize: 'var(--hero-fs-headline)',
                  }}
                >
                  « {t('hero.title')} »
                </h1>

                {/* Subtitle */}
                <p
                  className="hero-subtitle hero-art-in max-w-md mx-0 line-clamp-3 sm:line-clamp-none leading-[1.7]"
                  style={{
                    marginTop: 'var(--hero-gap-headline-subtitle)',
                    animationDelay: '0.14s',
                    fontFamily,
                    fontSize: 'var(--hero-fs-subtitle)',
                  }}
                >
                  {t('hero.subtitle')}
                </p>

                {/* Tagline — display font (EN) for punch */}
                <p
                  className="font-semibold text-[hsl(var(--hero-accent))] hero-art-in max-w-md mx-0"
                  style={{
                    marginTop: 'var(--hero-gap-subtitle-tagline)',
                    animationDelay: '0.2s',
                    fontFamily: fontDisplay,
                    fontSize: 'var(--hero-fs-tagline)',
                  }}
                >
                  {t('hero.tagline')}
                </p>

                {/* Hero viewport mobile only — centered above CTA */}
                <div
                  className="hero-wilson-viewport block md:hidden mx-auto my-6"
                  aria-hidden
                >
                  <div className="hero-wilson-viewport__stage">
                    <div className="hero-wilson-viewport__grain" aria-hidden />
                    {heroSources.map((item, i) => {
                      const slideContent = (
                        <img
                          src={item.src}
                          alt={item.alt}
                          className="hero-wilson-viewport__img"
                          loading={i === 0 ? 'eager' : 'lazy'}
                          {...(i === 0 ? ({ fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>) : {})}
                          decoding="async"
                          onError={(e) => {
                            const el = e.currentTarget
                            if (el.src !== HERO_FALLBACK_SRC) el.src = HERO_FALLBACK_SRC
                          }}
                        />
                      )
                      const wrapperClass = cn(
                        'hero-wilson-viewport__slide',
                        i === heroViewportIndex && 'hero-wilson-viewport__slide--active',
                        item.productSku && 'cursor-pointer'
                      )
                      return (
                        <div
                          key={item.id}
                          className={wrapperClass}
                          aria-hidden={i !== heroViewportIndex}
                        >
                          {item.productSku ? (
                            <Link to={`/products/${encodeURIComponent(item.productSku)}`} className="block size-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-[inherit]">
                              {slideContent}
                            </Link>
                          ) : (
                            slideContent
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* One CTA — Wilson UX: one gold focal per viewport */}
                <div
                  className="hero-art-in flex flex-col items-center md:items-start w-full max-w-md mx-0"
                  style={{ marginTop: 'var(--hero-gap-tagline-cta)', animationDelay: '0.28s' }}
                >
                  <Button size="lg" asChild className="min-h-[48px] px-8 cta-primary shadow-gold-cta font-semibold">
                    <Link to="/products">{t('hero.cta.products')}</Link>
                  </Button>
                </div>
              </div>

              {/* Hero viewport — admin-driven slides; modern frame, gold accent (desktop only here) */}
              <div
                className="hero-wilson-viewport hidden md:block"
                aria-hidden
              >
                <div className="hero-wilson-viewport__stage">
                  <div className="hero-wilson-viewport__grain" aria-hidden />
                  {heroSources.map((item, i) => {
                    const slideContent = (
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="hero-wilson-viewport__img"
                        loading={i === 0 ? 'eager' : 'lazy'}
                        {...(i === 0 ? ({ fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>) : {})}
                        decoding="async"
                        onError={(e) => {
                          const el = e.currentTarget
                          if (el.src !== HERO_FALLBACK_SRC) el.src = HERO_FALLBACK_SRC
                        }}
                      />
                    )
                    const wrapperClass = cn(
                      'hero-wilson-viewport__slide',
                      i === heroViewportIndex && 'hero-wilson-viewport__slide--active',
                      item.productSku && 'cursor-pointer'
                    )
                    return (
                      <div
                        key={item.id}
                        className={wrapperClass}
                        aria-hidden={i !== heroViewportIndex}
                      >
                        {item.productSku ? (
                          <Link to={`/products/${encodeURIComponent(item.productSku)}`} className="block size-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-[inherit]">
                            {slideContent}
                          </Link>
                        ) : (
                          slideContent
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Scroll hint — first category-with-products section or categories gateway */}
        <a
          href={categoriesWithProducts.length > 0 ? `#section-category-${categoriesWithProducts[0].slug}` : '#section-categories'}
          className="hero-scroll-hint"
          aria-label={language === 'ar' ? 'تمرير للأسفل' : 'Scroll down'}
          onClick={(e) => {
            e.preventDefault()
            const targetId = categoriesWithProducts.length > 0
              ? `section-category-${categoriesWithProducts[0].slug}`
              : 'section-categories'
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            window.history.replaceState(null, '', `${pathname}#${targetId}`)
          }}
        >
          <span className="hero-scroll-hint-dots" aria-hidden>
            <ChevronDown className="hero-scroll-hint-chevron hero-scroll-hint-chevron-1" strokeWidth={2.5} />
            <ChevronDown className="hero-scroll-hint-chevron hero-scroll-hint-chevron-2" strokeWidth={2.5} />
          </span>
        </a>
      </section>

      {/* Benefits — first content section */}
      <section
        className="section-padding-sm section-creative-warm section-rounded-bg"
        aria-labelledby="benefits-heading"
      >
        <div className="container-wide">
          <header className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2
              id="benefits-heading"
              className="text-h2 font-bold text-foreground mb-2 sm:mb-3 title-underline-gold title-underline-gold-center tracking-tight"
            >
              {language === 'ar' ? 'مزايا نضمنها لك' : 'Benefits we guarantee'}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed tracking-wide">
              {language === 'ar' ? 'ضمان وصيانة وتقسيط وشحن وتركيب — كل ما تحتاجه من ويلسن' : 'Warranty, service, installments, delivery & installation — all from Wilson'}
            </p>
          </header>
          <ul
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6 list-none p-0 m-0"
            role="list"
          >
            {socialProof.map((item, idx) => {
              const accent = [
                'border-s-4 border-primary',
                'border-t-4 border-primary',
                'bg-primary/10',
                'border-b-4 border-primary',
                'border-e-4 border-primary',
                'rounded-br-3xl ring-2 ring-primary/20',
              ][idx]
              const tiltClass = idx % 2 === 0 ? 'pill-tilt' : 'pill-tilt-alt'
              const iconRound = idx % 2 === 0 ? 'rounded-xl' : 'rounded-full'
              return (
                <li key={idx}>
                  <div
                    className={cn(
                      'group flex flex-col items-center text-center rounded-2xl border border-border bg-card shadow-sm p-3 sm:p-4 md:p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-md gold-glow min-h-[6.5rem] sm:min-h-[7.25rem]',
                      accent,
                      tiltClass
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 sm:w-11 sm:h-11 bg-primary/10 flex items-center justify-center shrink-0 text-primary mb-2.5 sm:mb-3 transition-transform duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100',
                        iconRound
                      )}
                    >
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} aria-hidden />
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-foreground leading-snug tracking-tight">
                      {item.label}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Categories — scroll-triggered with staggered cards */}
      <section
        id="section-categories"
        ref={cats.ref}
        className={cn(
          'reveal-section section-padding section-creative-accent section-warm-b',
          cats.isInView && 'in-view'
        )}
      >
        <div className="container-wide">
          <div className="text-center mb-10 sm:mb-12 reveal-child" style={staggerDelay(0)}>
            <h2 className="text-h2 font-bold text-foreground mb-3 sm:mb-4 title-underline-gold title-underline-gold-center">
              {t('categories.title')}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('categories.subtitle')}
            </p>
          </div>
          {/* Mobile/tablet: stepped chips (long / short / long). Web: gateway grid below. */}
          <div
            className="category-chips-creative lg:hidden"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            role="navigation"
            aria-label={t('categories.title')}
          >
            {categoriesFromApi.length === 0 ? null : (() => {
              const n = categoriesFromApi.length
              const row1 = Math.ceil(n / 3)
              const row2 = Math.ceil((2 * n) / 3)
              const rows = [
                categoriesFromApi.slice(0, row1),
                categoriesFromApi.slice(row1, row2),
                categoriesFromApi.slice(row2),
              ].filter((r) => r.length > 0)
              return rows.map((rowCats, rowIndex) => (
                <div key={rowIndex} className="category-chips-row">
                  <div className="category-chips" role="list">
                    {rowCats.map((cat, idx) => {
                      const hasSection = categoriesWithProducts.some((c) => c.slug === cat.slug)
                      const to = hasSection ? { pathname, hash: `section-category-${cat.slug}` } : `/products?category=${cat.slug}`
                      const label = language === 'ar' ? cat.nameAr : cat.nameEn
                      const delayIndex = rowIndex * 4 + idx + 1
                      return (
                        <Link
                          key={cat.slug}
                          to={to}
                          onClick={(e) => {
                            if (hasSection) {
                              e.preventDefault()
                              const el = document.getElementById(`section-category-${cat.slug}`)
                              el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                              window.history.replaceState(null, '', `${pathname}#section-category-${cat.slug}`)
                            }
                          }}
                          className="category-chip reveal-scale"
                          role="listitem"
                          aria-label={label}
                          style={staggerDelay(delayIndex, 70)}
                        >
                          <CategoryIcon categoryKey={cat.slug} size={20} className="text-primary" />
                          <span className="category-chip-label">{label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))
            })()}
          </div>

          {/* Web: category gateway — bento grid, icon + name, distinct from benefits pills */}
          <div
            className="category-gateway-grid hidden lg:grid"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            role="list"
            aria-label={t('categories.title')}
          >
            {categoriesFromApi.map((cat, idx) => {
              const hasSection = categoriesWithProducts.some((c) => c.slug === cat.slug)
              const to = hasSection ? { pathname, hash: `section-category-${cat.slug}` } : `/products?category=${cat.slug}`
              const label = language === 'ar' ? cat.nameAr : cat.nameEn
              return (
                <Link
                  key={cat.slug}
                  to={to}
                  onClick={(e) => {
                    if (hasSection) {
                      e.preventDefault()
                      const el = document.getElementById(`section-category-${cat.slug}`)
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      window.history.replaceState(null, '', `${pathname}#section-category-${cat.slug}`)
                    }
                  }}
                  className="category-gateway-card reveal-scale"
                  role="listitem"
                  aria-label={label}
                  style={staggerDelay(idx + 1, 60)}
                >
                  <CategoryIcon categoryKey={cat.slug} size={28} className="category-gateway-icon text-primary" />
                  <span className="category-gateway-label">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Category product sections — most products first, then low to lower (creative order) */}
      {[...categoryQueries]
        .map((query, idx) => ({
          cat: categoriesWithProducts[idx],
          products: query.data?.items ?? [],
          idx,
        }))
        .filter(({ cat }) => cat != null)
        .sort((a, b) => b.products.length - a.products.length)
        .map(({ cat, products }, sortedIdx) => {
          const sectionVariant: 'default' | 'muted' | 'alt' | 'dark' =
            sortedIdx % 4 === 0 ? 'default' : sortedIdx % 4 === 1 ? 'muted' : sortedIdx % 4 === 2 ? 'alt' : 'dark'
          return (
            <CategoryProductSection
              key={cat.slug}
              categoryKey={cat.slug}
              nameAr={cat.nameAr}
              nameEn={cat.nameEn}
              products={products}
              layout="vertical"
              variant={sectionVariant}
              icon={<CategoryIcon categoryKey={cat.slug} size={32} />}
            />
          )
        })}

      {/* Gold divider */}
      <div className="section-gold-divider" />

      {/* Why Wilson — scroll-triggered */}
      <section
        ref={whySection.ref}
        className={cn(
          'reveal-section section-padding section-alt-vision',
          whySection.isInView && 'in-view'
        )}
      >
        <div className="container-wide">
          <div className="text-center mb-10 sm:mb-12 reveal-child" style={staggerDelay(0)}>
            <h2 className="text-h2 font-bold text-foreground mb-3 sm:mb-4 title-underline-gold title-underline-gold-center">
              {t('why.title')}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              {t('why.subtitle')}
            </p>
          </div>
          <div className="why-strip">
            {pillars.map((pillar, idx) => (
              <article key={idx} className="why-strip-item reveal-child" style={staggerDelay(idx + 1, 100)}>
                <span className="why-strip-num" aria-hidden>{idx + 1}</span>
                <div className="why-strip-text">
                  <h3>{pillar.title}</h3>
                  <p>{pillar.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — elevated gold gradient + scroll-triggered */}
      <section
        ref={ctaSection.ref}
        className={cn(
          'reveal-section section-padding cta-vision cta-elevated grain-overlay',
          ctaSection.isInView && 'in-view'
        )}
      >
        <div className="container-wide text-center">
          <h2 className="text-h2 font-bold mb-3 sm:mb-4 title-underline-gold title-underline-gold-center reveal-child" style={staggerDelay(0)}>{t('cta.title')}</h2>
          <p className="text-base sm:text-lg cta-muted mb-6 sm:mb-8 max-w-2xl mx-auto reveal-child" style={staggerDelay(1)}>
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col items-center reveal-child" style={staggerDelay(2)}>
            <Button size="lg" asChild className="min-h-[44px] cta-primary">
              <Link to="/products">{t('cta.order')}</Link>
            </Button>
            <p className="cta-trust-line">
              {language === 'ar' ? 'شحن مجاني فوق 3,000 ج.م • ضمان أصلي' : 'Free shipping over 3,000 EGP • Original warranty'}
            </p>
            <a
              href="tel:+201080755516"
              className="text-sm font-medium text-[hsl(var(--hero-accent))] hover:underline mt-2"
            >
              {t('cta.call')}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
