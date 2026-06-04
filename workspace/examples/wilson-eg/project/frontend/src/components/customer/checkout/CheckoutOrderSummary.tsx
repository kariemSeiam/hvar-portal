import { ChevronDown, ChevronUp, Loader2, MessageCircle, ShieldCheck, Tag, Truck, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'
import type { CartItem } from '@/types'
import type { CheckoutCopy } from './constants'
import { WHATSAPP_URL } from './constants'

interface CheckoutOrderSummaryProps {
  items: CartItem[]
  subtotal: number
  shipping: number
  displayTotal: number
  copy: CheckoutCopy
  language: 'ar' | 'en'
  isRTL: boolean
  isSummaryExpanded: boolean
  onToggleSummary: () => void
  showCoupon: boolean
  onShowCoupon: () => void
  couponCode: string
  onCouponCodeChange: (v: string) => void
  appliedCoupon: { code: string; discountAmount: number } | null
  isValidatingCoupon: boolean
  onApplyCoupon: () => void
  onRemoveCoupon: () => void
  canPlaceOrder: boolean
  isPlacing: boolean
  onPlaceOrder: () => void
}

export function CheckoutOrderSummary({
  items,
  subtotal,
  shipping,
  displayTotal,
  copy,
  language,
  isRTL,
  isSummaryExpanded,
  onToggleSummary,
  showCoupon,
  onShowCoupon,
  couponCode,
  onCouponCodeChange,
  appliedCoupon,
  isValidatingCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  canPlaceOrder,
  isPlacing,
  onPlaceOrder,
}: CheckoutOrderSummaryProps) {
  const whatsappText =
    language === 'ar'
      ? 'مرحباً، لدي استفسار بخصوص طلبي'
      : 'Hi, I have a question about my order'

  return (
    <div>
      <Card className="checkout-summary-card-accent border border-border shadow-sm">
        <CardBody className="space-y-4 !p-4 sm:!p-6 !pt-4">
          <button
            type="button"
            onClick={onToggleSummary}
            className="flex w-full items-center justify-between gap-3 text-start lg:cursor-default"
            aria-expanded={isSummaryExpanded}
          >
            <h2 className="text-base font-bold text-foreground sm:text-[1rem]">
              <span className={language === 'ar' ? 'font-cairo' : ''}>
                {copy.mobileOrderSummary}
              </span>
            </h2>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground font-tajawal lg:hidden">
              {isSummaryExpanded ? copy.hideItems : copy.showItems}
              {isSummaryExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
          </button>

          <div
            className={`space-y-2 max-h-48 overflow-y-auto ${isSummaryExpanded ? 'block' : 'hidden'} lg:block`}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-2 text-sm"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <span className="min-w-0 flex-1 truncate font-tajawal">
                  {language === 'ar'
                    ? item.product.nameAr
                    : item.product.nameEn}
                </span>
                <span className="shrink-0 text-muted-foreground tabular-nums font-sans">
                  {item.quantity} × {formatPrice(item.price)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-1">
            {!showCoupon && !appliedCoupon && (
              <button
                type="button"
                onClick={onShowCoupon}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground text-[0.8125rem] font-medium font-tajawal"
              >
                <Tag className="h-4 w-4 shrink-0" aria-hidden />
                {copy.haveCoupon}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 ${language === 'ar' ? 'rotate-90' : '-rotate-90'}`}
                  aria-hidden
                />
              </button>
            )}
            {showCoupon && !appliedCoupon && (
              <div className="flex flex-col gap-2">
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Input
                    value={couponCode}
                    onChange={(e) => onCouponCodeChange(e.target.value)}
                    placeholder={copy.couponPlaceholder}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), onApplyCoupon())
                    }
                    className="min-h-[44px] flex-1 min-w-0"
                  />
                  <Button
                    onClick={onApplyCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim()}
                    variant="outline"
                    size="md"
                    className="min-h-[44px] shrink-0"
                  >
                    {isValidatingCoupon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      copy.apply
                    )}
                  </Button>
                </div>
              </div>
            )}
            {appliedCoupon && (
              <div
                className="flex items-center justify-between gap-2 rounded-lg border border-success-200 bg-success-50 p-3 dark:bg-success-900/20"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <span className="font-medium text-success-700 dark:text-success-400 font-tajawal text-sm">
                  {appliedCoupon.code} −
                  {formatPrice(appliedCoupon.discountAmount)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveCoupon}
                  className="shrink-0 text-muted-foreground hover:text-destructive min-h-[44px]"
                  aria-label={copy.remove}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-border pt-4 sm:pt-5">
            <div className="flex justify-between text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
              <span className="font-tajawal">{copy.subtotal}</span>
              <span className="tabular-nums font-sans">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
              <span className="font-tajawal">{copy.shipping}</span>
              <span className="tabular-nums font-sans">{formatPrice(shipping)}</span>
            </div>
            {appliedCoupon && (
              <div
                className="flex justify-between text-sm text-success-600 dark:text-success-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <span className="font-tajawal">{copy.discount}</span>
                <span className="tabular-nums font-sans">
                  −{formatPrice(appliedCoupon.discountAmount)}
                </span>
              </div>
            )}
            <div
              className="flex justify-between font-bold text-foreground text-base"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <span className={language === 'ar' ? 'font-cairo' : ''}>
                {copy.total}
              </span>
              <span className="tabular-nums font-sans">
                {formatPrice(displayTotal)}
              </span>
            </div>
          </div>

          <div className="checkout-trust-strip space-y-2 rounded-xl border border-border bg-background/60 p-3 ps-4 sm:p-4 sm:ps-5">
            <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted-foreground font-tajawal">
              <Truck className="h-4 w-4 shrink-0 text-primary/60" aria-hidden />
              {copy.trustFreeShipping}
            </p>
            <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted-foreground font-tajawal">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary/60" aria-hidden />
              {copy.trustWarranty}
            </p>
            <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted-foreground font-tajawal">
              <Truck className="h-4 w-4 shrink-0 text-primary/60" aria-hidden />
              {copy.trustDelivery}
            </p>
          </div>

          <Button
            className="w-full cta-primary checkout-cta-lift min-h-[44px]"
            size="lg"
            onClick={onPlaceOrder}
            disabled={!canPlaceOrder || isPlacing}
          >
            {isPlacing ? (
              <Loader2 className="h-5 w-5 animate-spin block mx-auto" aria-hidden />
            ) : (
              copy.placeOrder
            )}
          </Button>

          <a
            href={`${WHATSAPP_URL}?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-cta flex min-h-[44px] items-center justify-center gap-3 rounded-xl border-2 border-[#25D366]/40 bg-[#25D366]/10 px-5 py-3 text-[#25D366] transition-colors hover:bg-[#25D366]/15 font-medium text-sm"
            aria-label={copy.questionsWhatsApp}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <span className="font-tajawal">{copy.questionsWhatsApp}</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/20" aria-hidden>
              <MessageCircle className="h-4 w-4" />
            </span>
          </a>
        </CardBody>
      </Card>
    </div>
  )
}
