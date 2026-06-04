import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { ordersApi, couponsApi } from '@/services/api'
import { formatPrice } from '@/lib/utils'
import { PageBreadcrumb } from '@/components/customer/PageBreadcrumb'
import { ApplianceDoodleBg } from '@/components/customer/ApplianceDoodleBg'
import {
  CheckoutProgress,
  CheckoutAddressBlock,
  CheckoutPaymentStrip,
  CheckoutOrderSummary,
  getCheckoutCopy,
} from '@/components/customer/checkout'

/** Hand-drawn checkout complete icon — Wilson doodle style */
function CheckoutCompleteIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <g transform="translate(0, 2) rotate(-2, 16, 14)">
        {/* Bag body — centered in viewBox */}
        <path d="M6 10 L6 24 Q6 27 9 28 L23 28 Q26 27 26 24 L26 10" />
        {/* Bag top opening */}
        <path d="M6 10 Q10 8 16 8 Q22 8 26 10" />
        {/* Handle */}
        <path d="M11 10 Q11 4 16 4 Q21 4 21 10" strokeWidth="2" />
        {/* Checkmark */}
        <path d="M11 19 L15 23 L21 14" strokeWidth="2.5" />
        {/* Sparkle accents */}
        <circle cx="9" cy="13" r="0.7" fill="currentColor" stroke="none" />
        <circle cx="23" cy="15" r="0.5" fill="currentColor" stroke="none" />
      </g>
    </svg>
  )
}

const CheckoutPage = () => {
  const { language, isRTL, t: tNav } = useLanguage()
  const { isAuthenticated, addresses, addAddress, getDefaultAddress } = useAuth()
  const { items, subtotal, shipping, total, clearCart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const t = getCheckoutCopy(language)

  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discountAmount: number
  } | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [isPlacing, setIsPlacing] = useState(false)
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true)
  const [showCoupon, setShowCoupon] = useState(false)

  useEffect(() => {
    const state = location.state as {
      appliedCoupon?: { code: string; discountAmount: number }
      couponCode?: string
    } | null
    if (state?.appliedCoupon) {
      setAppliedCoupon(state.appliedCoupon)
      setCouponCode(state.appliedCoupon.code)
      setShowCoupon(true)
    } else if (state?.couponCode) {
      setCouponCode(state.couponCode)
    }
  }, [location.state])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    if (items.length === 0) {
      navigate('/cart', { replace: true })
      return
    }
  }, [isAuthenticated, items.length, navigate])

  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newGov, setNewGov] = useState('')
  const [newDistrict, setNewDistrict] = useState('')
  const [newDetails, setNewDetails] = useState('')
  const [isAddingAddress, setIsAddingAddress] = useState(false)

  const defaultAddr = getDefaultAddress()
  const resolvedAddressId =
    selectedAddressId || defaultAddr?.id || addresses[0]?.id || ''
  const currentStep = resolvedAddressId ? 'payment' : 'address'

  if (!isAuthenticated || items.length === 0) {
    return null
  }

  const validItems = items.filter(
    (item) => item.product.variantId && item.product.size
  )
  if (validItems.length < items.length) {
    return (
      <div
        className="checkout-page checkout-page-tight-top relative min-h-screen bg-transparent"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <ApplianceDoodleBg className="z-0" opacity={0.2} variant="mix" />
        <div className="container-wide py-6 relative z-10">
          <p className="text-destructive text-center font-tajawal text-sm">
            {language === 'ar'
              ? 'بعض المنتجات لا تحتوي على معلومات الطلب الصحيحة. يُرجى إزالتها وإضافتها مرة أخرى من صفحة المنتج.'
              : 'Some products are missing order info. Please remove them and add again from the product page.'}
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/cart')}
            className="mt-4 mx-auto block min-h-[44px]"
          >
            {language === 'ar' ? 'العودة للسلة' : 'Back to Cart'}
          </Button>
        </div>
      </div>
    )
  }

  const handleAddAddress = async () => {
    if (!newGov.trim() || !newDistrict.trim() || !newDetails.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
        variant: 'destructive',
      })
      return
    }
    setIsAddingAddress(true)
    try {
      await addAddress({
        governorate: newGov,
        district: newDistrict,
        details: newDetails,
        isDefault: false,
      })
      setNewGov('')
      setNewDistrict('')
      setNewDetails('')
      setShowAddAddress(false)
      toast({
        title: language === 'ar' ? 'تمت الإضافة' : 'Added',
        description:
          language === 'ar'
            ? 'تم إضافة العنوان بنجاح'
            : 'Address added successfully',
        variant: 'default',
      })
    } catch (e) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          (e as Error).message ||
          (language === 'ar' ? 'فشل إضافة العنوان' : 'Failed to add address'),
        variant: 'destructive',
      })
    } finally {
      setIsAddingAddress(false)
    }
  }

  const handleApplyCoupon = async () => {
    const code = couponCode.trim()
    if (!code) return
    setIsValidatingCoupon(true)
    setAppliedCoupon(null)
    try {
      const res = await couponsApi.validate(code, subtotal)
      setAppliedCoupon({
        code: res.code,
        discountAmount: res.discountAmount ?? 0,
      })
      toast({
        title: language === 'ar' ? 'تم تطبيق الكوبون' : 'Coupon Applied',
        description:
          language === 'ar'
            ? `خصم ${formatPrice(res.discountAmount ?? 0)}`
            : `Discount: ${formatPrice(res.discountAmount ?? 0)}`,
        variant: 'default',
      })
    } catch (e) {
      toast({
        title: language === 'ar' ? 'كوبون غير صالح' : 'Invalid Coupon',
        description:
          (e as { message?: string })?.message ??
          (language === 'ar' ? 'الكود غير صالح' : 'Invalid code'),
        variant: 'destructive',
      })
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
  }

  const displayTotal = Math.max(0, total - (appliedCoupon?.discountAmount ?? 0))
  const canPlaceOrder = !isPlacing && !!resolvedAddressId

  const handlePlaceOrder = async () => {
    const addressId =
      selectedAddressId || defaultAddr?.id || addresses[0]?.id
    if (!addressId && addresses.length === 0) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar'
            ? 'يجب إضافة عنوان توصيل'
            : 'Please add a delivery address',
        variant: 'destructive',
      })
      return
    }

    setIsPlacing(true)
    try {
      const orderPayload = {
        items: validItems.map((item) => ({
          variant_id: item.product.variantId!,
          size: item.product.size!,
          quantity: item.quantity,
        })),
        addressId: addressId || undefined,
        paymentMethod,
        coupon: appliedCoupon?.code ?? undefined,
      }
      await ordersApi.create(orderPayload)
      clearCart()
      toast({
        title: language === 'ar' ? 'تم الطلب' : 'Order Placed',
        description:
          language === 'ar'
            ? 'تم إرسال طلبك بنجاح'
            : 'Your order has been placed successfully',
        variant: 'default',
      })
      navigate('/')
    } catch (e) {
      const msg =
        (e as { message?: string })?.message ||
        (language === 'ar' ? 'فشل إرسال الطلب' : 'Failed to place order')
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setIsPlacing(false)
    }
  }

  return (
    <div
      className="checkout-page checkout-page-tight-top relative min-h-screen bg-transparent"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <ApplianceDoodleBg className="z-0" opacity={0.2} variant="mix" />
      <PageBreadcrumb
        dir={isRTL ? 'rtl' : 'ltr'}
        containerClassName="container-wide"
        ariaLabel={language === 'ar' ? 'مسار الصفحة' : 'Breadcrumb'}
        items={[
          { label: tNav('nav.home'), href: '/' },
          { label: tNav('nav.cart'), href: '/cart' },
          { label: t.title },
        ]}
      />
      <section aria-label={language === 'ar' ? 'إتمام الطلب' : 'Checkout'}>
        <div className="container-wide pt-2 pb-32 sm:pt-3 sm:pb-8">
          <header className="section-header-bar w-full min-w-0 flex flex-row flex-nowrap items-center gap-2 sm:gap-3 pb-5 sm:pb-6">
            <div
              className="section-header-icon flex items-center justify-center rounded-lg sm:rounded-xl overflow-visible ring-1 ring-primary/25 bg-primary/10 [&_svg]:text-primary"
              aria-hidden
            >
              <CheckoutCompleteIcon className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1
                className={`section-header-title font-bold text-foreground title-underline-gold w-full min-w-0 tracking-tight block ${language === 'ar' ? 'font-cairo font-extrabold' : ''}`}
              >
                {t.title}
              </h1>
              <p className="hidden text-sm text-muted-foreground font-tajawal leading-relaxed max-w-2xl mt-0.5 sm:block">
                {t.subtitle}
              </p>
            </div>
            <div className="hidden shrink-0 sm:block">
              <CheckoutProgress
                currentStep={currentStep}
                copy={t}
                language={language}
                variant="inline"
              />
            </div>
          </header>

          <div className="sm:hidden mb-4">
            <CheckoutProgress
              currentStep={currentStep}
              copy={t}
              language={language}
              variant="inline"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 lg:gap-6">
            <div className="space-y-4 sm:space-y-5 lg:col-span-7">
              <CheckoutAddressBlock
                addresses={addresses}
                selectedAddressId={selectedAddressId}
                defaultAddressId={defaultAddr?.id}
                onSelect={setSelectedAddressId}
                copy={t}
                language={language}
                showAddForm={showAddAddress}
                onToggleAddForm={() => setShowAddAddress((prev) => !prev)}
                newGov={newGov}
                newDistrict={newDistrict}
                newDetails={newDetails}
                onNewGovChange={setNewGov}
                onNewDistrictChange={setNewDistrict}
                onNewDetailsChange={setNewDetails}
                onAddAddress={handleAddAddress}
                isAdding={isAddingAddress}
              />
              <CheckoutPaymentStrip
                value={paymentMethod}
                onChange={setPaymentMethod}
                copy={t}
                language={language}
              />
            </div>

            <div className="lg:col-span-5">
              <CheckoutOrderSummary
                items={items}
                subtotal={subtotal}
                shipping={shipping}
                displayTotal={displayTotal}
                copy={t}
                language={language}
                isRTL={isRTL}
                isSummaryExpanded={isSummaryExpanded}
                onToggleSummary={() => setIsSummaryExpanded((prev) => !prev)}
                showCoupon={showCoupon}
                onShowCoupon={() => setShowCoupon(true)}
                couponCode={couponCode}
                onCouponCodeChange={setCouponCode}
                appliedCoupon={appliedCoupon}
                isValidatingCoupon={isValidatingCoupon}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={handleRemoveCoupon}
                canPlaceOrder={canPlaceOrder}
                isPlacing={isPlacing}
                onPlaceOrder={handlePlaceOrder}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CheckoutPage
