import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Trash2, Plus, Minus, ShoppingBag, Package, ChevronDown, Tag, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { couponsApi } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { PageBreadcrumb } from '@/components/customer/PageBreadcrumb'
import { ApplianceDoodleBg } from '@/components/customer/ApplianceDoodleBg'
import { CustomerEmptyState } from '@/components/customer/CustomerEmptyState'

const CartPage = () => {
  const { t, language } = useLanguage()
  const isRTL = language === 'ar'
  const { items, subtotal, shipping, total, updateQuantity, removeItem } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [showCoupon, setShowCoupon] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)

  const discount = appliedCoupon?.discountAmount ?? 0
  const displayTotal = Math.max(0, total - discount)

  const handleApplyCoupon = async () => {
    const code = couponInput.trim()
    if (!code) return
    if (!isAuthenticated) {
      toast({
        title: language === 'ar' ? 'تسجيل الدخول' : 'Sign in',
        description: language === 'ar' ? 'سجّل الدخول لتطبيق الكود في صفحة الدفع' : 'Sign in to apply your code at checkout',
        variant: 'default',
      })
      return
    }
    setIsValidatingCoupon(true)
    try {
      const res = await couponsApi.validate(code, subtotal)
      setAppliedCoupon({ code: res.code, discountAmount: res.discountAmount ?? 0 })
      toast({
        title: language === 'ar' ? 'تم تطبيق الكود' : 'Code applied',
        description: language === 'ar' ? `خصم ${(res.discountAmount ?? 0).toLocaleString()} ج.م` : `Discount ${(res.discountAmount ?? 0).toLocaleString()} EGP`,
        variant: 'default',
      })
    } catch {
      toast({
        title: language === 'ar' ? 'كود غير صالح' : 'Invalid code',
        description: language === 'ar' ? 'تحقق من الكود وحاول مرة أخرى' : 'Check the code and try again',
        variant: 'destructive',
      })
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
  }

  const handleCheckout = () => {
    navigate('/checkout', {
      state: appliedCoupon ? { appliedCoupon } : { couponCode: couponInput.trim() || undefined },
    })
  }

  if (items.length === 0) {
    return (
      <CustomerEmptyState
        variant="page"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        icon={<ShoppingBag className="h-12 w-12 sm:h-14 sm:w-14" />}
        title={t('cart.empty')}
        description={language === 'ar' ? 'ابدأ التسوق الآن' : 'Start shopping now'}
        action={
          <>
            <Button asChild className="cta-primary min-h-[44px]">
              <Link to="/products">{t('cart.continue')}</Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-6 max-w-xs text-center">
              {t('common.trustLine')}
            </p>
          </>
        }
      />
    )
  }

  const getProductDisplayName = (item: (typeof items)[0]) => {
    return language === 'ar' ? item.product.nameAr : item.product.nameEn
  }

  const SummaryBlock = ({ sticky = false, showCheckoutButton = true }: { sticky?: boolean; showCheckoutButton?: boolean }) => (
    <div
      className={cn(
        'p-6 bg-card rounded-xl border border-border space-y-4',
        sticky && 'lg:sticky lg:top-24'
      )}
    >
      <h2 className="text-lg font-bold text-foreground">
        {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between text-foreground">
          <span className="text-muted-foreground">{t('cart.subtotal')}</span>
          <span className="font-medium tabular-nums font-sans">
            {subtotal.toLocaleString()} {t('common.egp')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('cart.shipping')}</span>
          <span className="font-medium text-success-600 tabular-nums font-sans">
            {shipping === 0
              ? language === 'ar'
                ? 'مجاني'
                : 'Free'
              : `${shipping.toLocaleString()} ${t('common.egp')}`}
          </span>
        </div>

        {/* Collapsible coupon — Wilson UX: not prominent */}
        <div className="pt-1">
          {!showCoupon && !appliedCoupon && (
            <button
              type="button"
              onClick={() => setShowCoupon(true)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              <Tag className="h-4 w-4" aria-hidden />
              {language === 'ar' ? 'لديك كود خصم؟' : 'Have a coupon?'}
              <ChevronDown className={cn('h-4 w-4', isRTL ? 'rotate-90' : '-rotate-90')} aria-hidden />
            </button>
          )}
          {showCoupon && !appliedCoupon && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل الكود' : 'Enter code'}
                  className="flex-1 min-h-[44px]"
                  aria-label={language === 'ar' ? 'كود الخصم' : 'Discount code'}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon || !couponInput.trim()}
                  className="min-h-[44px] shrink-0"
                >
                  {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : language === 'ar' ? 'تطبيق' : 'Apply'}
                </Button>
              </div>
              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'يمكنك تطبيق الكود في صفحة الدفع' : 'You can apply your code at checkout'}
                </p>
              )}
            </div>
          )}
          {appliedCoupon && (
            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
              <span className="text-sm font-medium text-foreground">
                {appliedCoupon.code} −{appliedCoupon.discountAmount.toLocaleString()} {t('common.egp')}
              </span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label={language === 'ar' ? 'إزالة الكود' : 'Remove code'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-success-600">
            <span className="text-muted-foreground">{language === 'ar' ? 'الخصم' : 'Discount'}</span>
            <span className="font-medium tabular-nums font-sans">−{discount.toLocaleString()} {t('common.egp')}</span>
          </div>
        )}

        <div className="h-px bg-border" />
        <div className="flex justify-between">
          <span className="font-bold text-foreground">{t('cart.total')}</span>
          <span className="text-xl font-bold text-foreground tabular-nums font-sans">
            {displayTotal.toLocaleString()} {t('common.egp')}
          </span>
        </div>
      </div>

      {showCheckoutButton && (
        <>
          <Button
            className="w-full cta-primary min-h-[44px] text-base"
            size="lg"
            onClick={handleCheckout}
            asChild={false}
          >
            {t('cart.checkout')}
          </Button>
          <p className="text-xs text-muted-foreground text-center cart-summary-trust">
            {language === 'ar' ? 'شحن مجاني فوق ٣٬٠٠٠ ج.م • ضمان أصلي ويلسون' : 'Free shipping over 3,000 EGP • Wilson original warranty'}
          </p>
          <Button variant="outline" className="w-full min-h-[44px]" asChild>
            <Link to="/products">{t('cart.continue')}</Link>
          </Button>
        </>
      )}
      {!showCheckoutButton && (
        <>
          <p className="text-xs text-muted-foreground text-center cart-summary-trust">
            {language === 'ar' ? 'شحن مجاني فوق ٣٬٠٠٠ ج.م • ضمان أصلي ويلسون' : 'Free shipping over 3,000 EGP • Wilson original warranty'}
          </p>
          <Button variant="outline" className="w-full min-h-[44px]" asChild>
            <Link to="/products">{t('cart.continue')}</Link>
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div
      className="cart-page relative min-h-screen bg-transparent"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <ApplianceDoodleBg className="z-0" opacity={0.2} variant="mix" />
      <PageBreadcrumb
        dir={isRTL ? 'rtl' : 'ltr'}
        containerClassName="container-wide"
        ariaLabel={language === 'ar' ? 'مسار الصفحة' : 'Breadcrumb'}
        items={[
          { label: t('nav.home'), href: '/' },
          { label: t('cart.title') },
        ]}
      />
      <section aria-label={language === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}>
        <div className="container-wide pt-2 pb-8 sm:pt-3 sm:pb-10">
          <header
            className="section-header-bar w-full min-w-0 flex flex-row flex-nowrap items-center gap-2 sm:gap-3 pb-5 sm:pb-6"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div
              className="section-header-icon flex items-center justify-center rounded-lg sm:rounded-xl overflow-visible ring-1 ring-primary/25 bg-primary/10 [&_svg]:text-primary"
              aria-hidden
            >
              <ShoppingBag className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1 className="section-header-title font-bold text-foreground title-underline-gold w-full min-w-0 tracking-tight block">
                {t('cart.title')}
              </h1>
            </div>
          </header>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="cart-item-row flex gap-4 sm:gap-5 p-4 sm:p-5 bg-card rounded-2xl border border-border shadow-sm"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {/* Image — fixed size, link to product */}
                  <Link
                    to={`/products/${item.product.sku}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-muted/40 flex items-center justify-center ring-1 ring-border/60 hover:ring-primary/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label={getProductDisplayName(item)}
                  >
                    {(item.product.thumbnail || item.product.images?.[0]) ? (
                      <img
                        src={item.product.thumbnail || item.product.images?.[0]}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" aria-hidden />
                    )}
                  </Link>

                  {/* Content — name, meta, price, actions */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5 sm:gap-2">
                    {/* Row 1: name + remove */}
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/products/${item.product.sku}`}
                        className="group min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md -m-1 p-1 flex items-center min-h-[2.5rem] sm:min-h-[2.75rem]"
                      >
                        <h3 className="font-semibold text-foreground text-sm sm:text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {getProductDisplayName(item)}
                        </h3>
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        className="flex-shrink-0 p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                        aria-label={language === 'ar' ? 'حذف' : 'Remove'}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Row 2: SKU + warranty — one muted line */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-muted-foreground font-sans">
                      <span className="text-primary/80 tabular-nums">{item.product.sku}</span>
                      {typeof item.product.warrantyYears === 'number' && item.product.warrantyYears > 0 && (
                        <>
                          <span className="text-border" aria-hidden>·</span>
                          <span>
                            {language === 'ar'
                              ? `ضمان أصلي ${item.product.warrantyYears} ${item.product.warrantyYears === 1 ? 'سنة' : 'سنوات'}`
                              : `${item.product.warrantyYears}-year warranty`}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Row 3: price — prominent */}
                    <p className="text-base sm:text-lg font-bold text-foreground tabular-nums font-sans">
                      {item.price.toLocaleString()} {t('common.egp')}
                    </p>

                    {/* Row 4: quantity + stepper */}
                    <div className="flex items-center gap-3 flex-wrap mt-0.5">
                      <div className="flex items-center border border-border rounded-xl overflow-hidden bg-muted/20">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-2.5 hover:bg-muted rounded-s-xl min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors text-foreground"
                          aria-label={language === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span
                          className="px-3 sm:px-4 font-medium min-w-[2ch] text-center tabular-nums font-sans text-sm text-foreground"
                          dir="ltr"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-2.5 hover:bg-muted rounded-e-xl min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors text-foreground"
                          aria-label={language === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground font-sans tabular-nums">
                        {language === 'ar' ? 'المجموع:' : 'Total:'} {(item.price * item.quantity).toLocaleString()} {t('common.egp')}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop: sidebar summary */}
            <div className="hidden lg:block lg:col-span-1">
              <SummaryBlock sticky />
            </div>

            {/* Mobile: summary in flow — full summary + checkout CTA (no sticky bar) */}
            <div className="lg:hidden mt-6">
              <SummaryBlock />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CartPage
