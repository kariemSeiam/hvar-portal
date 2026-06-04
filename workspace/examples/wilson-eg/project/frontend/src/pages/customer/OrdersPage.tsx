import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { ordersApi } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageBreadcrumb } from '@/components/customer/PageBreadcrumb'
import { CustomerEmptyState } from '@/components/customer/CustomerEmptyState'
import { Package, ShoppingBag, Check, Circle, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import type { OrderStatus } from '@/types'
import { OrderTrackingTimeline } from '@/components/customer/OrderTrackingTimeline'
import { useToast } from '@/hooks/useToast'
import { getUploadImageSrc } from '@/services/api'
import { ApplianceDoodleBg } from '@/components/customer/ApplianceDoodleBg'
import { cn, formatOrderDisplayId } from '@/lib/utils'

type OrderCoupon = {
  code: string
  discountType: string
  discountValue: number
  discountAmount?: number
}

type OrderItem = {
  productName: string
  quantity: number
  totalPrice: number
  image?: string | null
  size?: string
  variant?: string
}

type TrackingStep = {
  status: string
  description: string
  timestamp: string
  completed?: boolean
}

type OrderListItem = {
  id: string
  status: OrderStatus
  total: number
  subtotal?: number
  discount?: number
  shippingFee?: number
  createdAt: string
  items: OrderItem[]
  coupon?: OrderCoupon | null
  tracking?: TrackingStep[]
}

function getProductDisplayName(item: OrderItem, language: string): string {
  if (item.productName?.trim()) return item.productName.trim()
  if (item.variant?.trim()) return item.variant.trim()
  return language === 'ar' ? 'منتج' : 'Product'
}

const statusLabels: Record<OrderStatus, { ar: string; en: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  processing: { ar: 'قيد التجهيز', en: 'Processing' },
  shipped: { ar: 'تم الشحن', en: 'Shipped' },
  delivered: { ar: 'تم التوصيل', en: 'Delivered' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
}

/** Wilson: each status has a distinct color — gold = in progress, success = done, destructive = cancelled, warm amber = pending */
const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700/50',
  processing: 'bg-primary/15 text-primary border border-primary/30',
  shipped: 'bg-primary/15 text-primary border border-primary/30',
  delivered: 'bg-success-500/15 text-success-600 dark:text-success-400 border border-success-500/25',
  cancelled: 'bg-destructive/10 text-destructive border border-destructive/25',
}

const FILTER_OPTIONS: { value: 'all' | OrderStatus; labelAr: string; labelEn: string }[] = [
  { value: 'all', labelAr: 'الكل', labelEn: 'All' },
  { value: 'pending', labelAr: 'قيد الانتظار', labelEn: 'Pending' },
  { value: 'processing', labelAr: 'قيد التجهيز', labelEn: 'Processing' },
  { value: 'shipped', labelAr: 'تم الشحن', labelEn: 'Shipped' },
  { value: 'delivered', labelAr: 'تم التوصيل', labelEn: 'Delivered' },
  { value: 'cancelled', labelAr: 'ملغي', labelEn: 'Cancelled' },
]

const OrdersPage = () => {
  const { t, language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll({ page: 1, perPage: 50 }),
    enabled: isAuthenticated,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setSelectedOrderId(null)
      toast({
        title: language === 'ar' ? 'تم الإلغاء' : 'Order cancelled',
        variant: 'default',
      })
    },
    onError: (err: Error) => {
      toast({
        title: language === 'ar' ? 'فشل الإلغاء' : 'Failed to cancel',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const allOrders: OrderListItem[] = data?.items ?? []
  const orders =
    statusFilter === 'all'
      ? allOrders
      : allOrders.filter((o) => o.status === statusFilter)
  const isRTL = language === 'ar'

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  return (
    <div className="orders-page relative min-h-screen bg-transparent" dir={isRTL ? 'rtl' : 'ltr'}>
      <ApplianceDoodleBg className="z-0" opacity={0.2} variant="mix" />
      <PageBreadcrumb
        dir={isRTL ? 'rtl' : 'ltr'}
        containerClassName="container-wide"
        ariaLabel={language === 'ar' ? 'مسار الصفحة' : 'Breadcrumb'}
        items={[
          { label: t('nav.home'), href: '/' },
          { label: t('nav.account'), href: '/account' },
          { label: t('orders.title') },
        ]}
      />
      <section aria-label={t('orders.title')}>
        <div className="container-wide pt-2 pb-32 sm:pt-4 sm:pb-12">
          {/* Header: one job — "See and track your orders" */}
          <header
            className="section-header-bar w-full min-w-0 flex flex-row flex-nowrap items-center gap-2 sm:gap-3 pb-4 sm:pb-5"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div
              className="section-header-icon flex items-center justify-center rounded-lg sm:rounded-xl overflow-visible ring-1 ring-primary/25 bg-primary/10 [&_svg]:text-primary"
              aria-hidden
            >
              <Package className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1 className={cn(
                'section-header-title font-bold text-foreground title-underline-gold w-full min-w-0 tracking-tight block',
                isRTL && 'font-cairo font-extrabold'
              )}>
                {t('orders.title')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {language === 'ar' ? 'تتبع وإدارة طلباتك في مكان واحد' : 'Track and manage your orders in one place'}
              </p>
            </div>
          </header>

          {/* Filter chips — horizontal scroll, no scrollbar, one line (mobile + desktop) */}
          {!isLoading && allOrders.length > 0 && (
            <div className="chips-row-scroll gap-2 mb-6 pb-1 -mx-px">
              {FILTER_OPTIONS.map((opt) => {
                const isActive = statusFilter === opt.value
                const label = language === 'ar' ? opt.labelAr : opt.labelEn
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatusFilter(opt.value)}
                    className={cn(
                      'inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold min-h-[44px] transition-colors flex-shrink-0',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                      isActive
                        ? 'bg-primary/15 text-primary border-2 border-primary'
                        : 'bg-muted/60 text-muted-foreground border-2 border-transparent hover:bg-muted hover:text-foreground'
                    )}
                    aria-pressed={isActive}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          {isLoading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
              role="status"
              aria-label={language === 'ar' ? 'جاري التحميل' : 'Loading'}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <CustomerEmptyState
              variant="subsection"
              dir={isRTL ? 'rtl' : 'ltr'}
              icon={<Package className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden />}
              title={statusFilter === 'all' ? t('orders.empty') : (language === 'ar' ? 'لا توجد طلبات بهذه الحالة' : 'No orders in this status')}
              description={
                language === 'ar'
                  ? statusFilter === 'all'
                    ? 'عندما تطلب أي منتج، ستظهر طلباتك هنا. تسوق ويلسون بثقة.'
                    : 'غيّر الفلتر أو تسوق لإضافة طلبات جديدة.'
                  : statusFilter === 'all'
                    ? 'When you place an order, it will appear here. Shop Wilson with confidence.'
                    : 'Change the filter or shop to add new orders.'
              }
              action={
                <>
                  {statusFilter === 'all' ? (
                    <Button asChild className="cta-primary min-h-[44px]">
                      <Link to="/products">{t('nav.products')}</Link>
                    </Button>
                  ) : (
                    <Button className="cta-primary min-h-[44px]" onClick={() => setStatusFilter('all')}>
                      {language === 'ar' ? 'عرض الكل' : 'Show all'}
                    </Button>
                  )}
                  {statusFilter === 'all' && (
                    <p className="text-xs text-muted-foreground mt-6 max-w-xs text-center">
                      {t('common.trustLine')}
                    </p>
                  )}
                </>
              }
            />
          ) : (
            <>
              {/* Grid: product-style layout — 2 cols sm, 3 cols lg */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 list-none p-0 m-0 items-start" role="list">
                {orders.map((order) => (
                  <li key={order.id} role="listitem">
                    <article
                      className={cn(
                        'group flex flex-col h-full rounded-2xl border border-border bg-card overflow-hidden',
                        'transition-all duration-200 ease-out',
                        'hover:border-primary/30 hover:shadow-card focus-within:border-primary/30 focus-within:shadow-card'
                      )}
                      aria-labelledby={`order-${order.id}-title`}
                    >
                      {/* Top accent: subtle gold band (brand strip) */}
                      <div className="h-1 w-full bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40 shrink-0" aria-hidden />

                      <div
                        className="flex flex-col h-full cursor-pointer select-none flex-1 min-h-0"
                        onClick={() => {
                          setExpandedOrderIds((prev) => {
                            const next = new Set(prev)
                            if (next.has(order.id)) next.delete(order.id)
                            else next.add(order.id)
                            return next
                          })
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setExpandedOrderIds((prev) => {
                              const next = new Set(prev)
                              if (next.has(order.id)) next.delete(order.id)
                              else next.add(order.id)
                              return next
                            })
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={expandedOrderIds.has(order.id)}
                        aria-label={language === 'ar' ? `طلب ${formatDate(order.createdAt)}، ${statusLabels[order.status]?.ar}، ${order.total.toLocaleString()} ${t('common.egp')}` : `Order ${formatDate(order.createdAt)}, ${statusLabels[order.status]?.en}, ${order.total.toLocaleString()} ${t('common.egp')}`}
                      >
                        <div className="flex flex-col flex-1 min-h-0 p-5 pt-4">
                          {/* 1. Date + status — clear hierarchy */}
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <h2 id={`order-${order.id}-title`} className="text-[1.0625rem] font-extrabold text-foreground font-cairo tracking-tight leading-tight">
                              {formatDate(order.createdAt)}
                            </h2>
                            <span
                              className={cn(
                                'inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide shrink-0',
                                statusStyles[order.status] ?? statusStyles.pending
                              )}
                            >
                              {isRTL ? statusLabels[order.status]?.ar : statusLabels[order.status]?.en}
                            </span>
                          </div>

                          {/* 2. Products: label + list — match modal style, icon + bold */}
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h3 className="text-xs font-bold text-foreground font-cairo flex items-center gap-1.5">
                                <ShoppingBag className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                                {t('orders.items')}
                              </h3>
                            </div>
                            <ul className="space-y-2 list-none p-0 m-0" role="list">
                              {(order.items ?? []).slice(0, 2).map((item, idx) => (
                                <li
                                  key={idx}
                                  role="listitem"
                                  className="flex items-center gap-2.5 text-sm py-2 px-3 rounded-lg border border-border bg-muted/25 dark:bg-muted/15"
                                >
                                  {idx === 0 && (
                                    <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                                      {item.image ? (
                                        <img
                                          src={getUploadImageSrc(item.image)}
                                          alt=""
                                          className="h-full w-full object-contain"
                                        />
                                      ) : (
                                        <ShoppingBag className="h-5 w-5 text-muted-foreground" aria-hidden />
                                      )}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <span className="text-foreground font-semibold truncate block leading-snug">
                                      {getProductDisplayName(item, language)}
                                    </span>
                                  </div>
                                  <span className="shrink-0 ms-auto text-muted-foreground tabular-nums font-sans text-[13px]">×{item.quantity}</span>
                                </li>
                              ))}
                              {(order.items?.length ?? 0) > 2 && (
                                <li className="text-xs text-muted-foreground py-1.5 px-3">
                                  {language === 'ar' ? `+ ${order.items!.length - 2} أخرى` : `+ ${order.items!.length - 2} more`}
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* 3. Price breakdown — like modal, compact for card; dir for RTL/LTR */}
                          <div
                            className="rounded-xl border border-border bg-muted/30 dark:bg-muted/20 px-4 py-3 mb-4 text-sm text-muted-foreground space-y-1"
                            dir={isRTL ? 'rtl' : 'ltr'}
                          >
                            {order.subtotal != null && (
                              <p className="flex justify-between gap-3">
                                <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                <span className="tabular-nums font-sans shrink-0" dir="ltr">{order.subtotal.toLocaleString()} {t('common.egp')}</span>
                              </p>
                            )}
                            {order.discount != null && order.discount > 0 && (
                              <p className="flex justify-between gap-3 text-primary items-center">
                                <span className="inline-flex items-center gap-1.5 flex-wrap">
                                  {language === 'ar' ? 'الخصم' : 'Discount'}
                                  {order.coupon && (
                                    <span
                                      className={cn(
                                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                        'bg-primary/15 text-primary border border-primary/30'
                                      )}
                                      title={order.coupon.discountType === 'percentage' ? `${order.coupon.code} — ${order.coupon.discountValue}%` : `${order.coupon.code}`}
                                    >
                                      <Tag className="h-2.5 w-2.5 shrink-0" aria-hidden />
                                      {order.coupon.discountType === 'percentage' ? `${order.coupon.discountValue}%` : (language === 'ar' ? 'خصم' : 'Offer')}
                                    </span>
                                  )}
                                </span>
                                <span className="tabular-nums font-sans shrink-0" dir="ltr">-{order.discount.toLocaleString()} {t('common.egp')}</span>
                              </p>
                            )}
                            {order.shippingFee != null && order.shippingFee > 0 && (
                              <p className="flex justify-between gap-3">
                                <span>{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                                <span className="tabular-nums font-sans shrink-0" dir="ltr">{order.shippingFee.toLocaleString()} {t('common.egp')}</span>
                              </p>
                            )}
                            <p className="flex justify-between gap-3 font-bold text-foreground pt-1.5 border-t border-border/70">
                              <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                              <span className="tabular-nums font-sans shrink-0" dir="ltr">{order.total.toLocaleString()} {t('common.egp')}</span>
                            </p>
                          </div>

                          {/* 4. Bottom: journey timeline — collapsed by default, expand on card click */}
                          <div className="mt-auto pt-3 -mx-5 px-5 pb-2 border-t border-border bg-muted/20 dark:bg-muted/10 rounded-b-2xl">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pt-1 flex items-center gap-1.5">
                              {language === 'ar' ? 'رحلة الطلب' : 'Order journey'}
                              {expandedOrderIds.has(order.id) ? (
                                <ChevronUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              )}
                            </p>
                            {expandedOrderIds.has(order.id) && (
                              <>
                                {(order.tracking?.length ?? 0) === 0 ? (
                                  <p className="text-xs text-muted-foreground mb-2 mt-1">
                                    {language === 'ar' ? 'لا توجد مراحل بعد' : 'No steps yet'}
                                  </p>
                                ) : (
                                  <div
                                    className="flex justify-center overflow-x-auto overflow-y-hidden pb-2 mt-2 scrollbar-hide snap-x snap-mandatory"
                                    role="list"
                                    aria-label={language === 'ar' ? 'مراحل الطلب' : 'Order steps'}
                                  >
                                    <div
                                      className={cn(
                                        'flex items-stretch gap-0 flex-shrink-0 min-w-0',
                                        isRTL && 'flex-row-reverse'
                                      )}
                                    >
                                    {(order.tracking ?? []).map((step, i) => {
                                      const isCompleted = step.completed !== false
                                      const prevCompleted = i > 0 && (order.tracking?.[i - 1]?.completed !== false)
                                      const label = isRTL ? (statusLabels[step.status as OrderStatus]?.ar ?? step.status) : (statusLabels[step.status as OrderStatus]?.en ?? step.status)
                                      const stepDate = new Date(step.timestamp).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                      return (
                                        <div
                                          key={i}
                                          className={cn('flex flex-shrink-0 items-stretch min-w-0 snap-center', isRTL && 'flex-row-reverse')}
                                          role="listitem"
                                        >
                                          {i > 0 && (
                                            <div
                                              className={cn(
                                                'w-2 flex-shrink-0 self-center rounded-full h-0.5',
                                                prevCompleted ? 'bg-primary' : 'bg-border'
                                              )}
                                              aria-hidden
                                            />
                                          )}
                                          <div
                                            className={cn(
                                              'flex flex-col items-center text-center flex-1 min-w-[100px] max-w-[140px] rounded-xl px-2.5 py-2.5 border shadow-sm',
                                              isCompleted
                                                ? 'bg-primary/5 border-primary/20'
                                                : 'bg-card border-border'
                                            )}
                                          >
                                            <div
                                              className={cn(
                                                'flex shrink-0 items-center justify-center rounded-full',
                                                isCompleted
                                                  ? 'h-7 w-7 bg-primary text-primary-foreground border border-primary'
                                                  : 'h-7 w-7 border-2 border-border bg-card text-muted-foreground'
                                              )}
                                            >
                                              {isCompleted ? (
                                                <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                                              ) : (
                                                <Circle className="h-2 w-2" strokeWidth={2} aria-hidden />
                                              )}
                                            </div>
                                            <p className={cn('mt-1.5 text-[11px] font-cairo font-semibold leading-tight', isCompleted ? 'text-foreground' : 'text-muted-foreground')}>
                                              {label}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1 leading-tight">
                                              {step.description}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-muted-foreground/90 tabular-nums font-sans" dir="ltr">
                                              {stepDate}
                                            </p>
                                          </div>
                                        </div>
                                      )
                                    })}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>

              {/* Order detail: Dialog (Wilson modal — max-w-xl, scrollable) */}
              <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
                <DialogContent
                  className="max-w-xl max-h-[90vh] overflow-y-auto"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {selectedOrderId && (() => {
                    const order = orders.find((o) => o.id === selectedOrderId)
                    if (!order) return null
                    return (
                      <>
                        <DialogHeader>
                          <DialogTitle className="flex flex-wrap items-center gap-2 font-cairo">
                            <span>{formatDate(order.createdAt)}</span>
                            <span
                              className={cn(
                                'inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold',
                                statusStyles[order.status] ?? statusStyles.pending
                              )}
                            >
                              {isRTL ? statusLabels[order.status]?.ar : statusLabels[order.status]?.en}
                            </span>
                          </DialogTitle>
                          <p className="text-xs text-muted-foreground font-sans tabular-nums" dir="ltr" title={order.id}>
                            {language === 'ar' ? 'رقم الطلب ' : 'Order '}{formatOrderDisplayId(order.id)}
                          </p>
                          {(order.subtotal != null || order.discount != null || (order.shippingFee != null && order.shippingFee > 0)) && (
                            <div className="text-sm text-muted-foreground space-y-0.5 pt-1">
                              {order.subtotal != null && (
                                <p className="flex justify-between gap-4">
                                  <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                  <span className="tabular-nums font-sans">{order.subtotal.toLocaleString()} {t('common.egp')}</span>
                                </p>
                              )}
                              {order.discount != null && order.discount > 0 && (
                                <p className="flex justify-between gap-4 text-primary">
                                  <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                                  <span className="tabular-nums font-sans">-{order.discount.toLocaleString()} {t('common.egp')}</span>
                                </p>
                              )}
                              {order.shippingFee != null && order.shippingFee > 0 && (
                                <p className="flex justify-between gap-4">
                                  <span>{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                                  <span className="tabular-nums font-sans">{order.shippingFee.toLocaleString()} {t('common.egp')}</span>
                                </p>
                              )}
                              <p className="flex justify-between gap-4 font-bold text-foreground pt-1 border-t border-border">
                                <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                                <span className="tabular-nums font-sans">{order.total.toLocaleString()} {t('common.egp')}</span>
                              </p>
                            </div>
                          )}
                        </DialogHeader>
                        <div className="space-y-6 pt-2">
                          <div>
                            <h3 className="text-sm font-bold text-foreground font-cairo mb-3 flex items-center gap-2">
                              <ShoppingBag className="h-4 w-4 text-primary" aria-hidden />
                              {language === 'ar' ? 'المنتجات' : 'Products'}
                            </h3>
                            <ul className="space-y-2 list-none p-0 m-0">
                              {(order.items ?? []).map((item, idx) => (
                                <li
                                  key={idx}
                                  className="flex justify-between items-baseline gap-4 py-2.5 border-b border-border/70 last:border-0"
                                >
                                  <span className="text-sm text-foreground truncate">
                                    {getProductDisplayName(item, language)} × <span className="tabular-nums font-sans font-medium">{item.quantity}</span>
                                  </span>
                                  <span className="text-sm font-bold tabular-nums font-sans text-foreground shrink-0">
                                    {(item.totalPrice ?? 0).toLocaleString()} {t('common.egp')}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <OrderTrackingTimeline orderId={order.id} isVisible={true} />
                          {order.status === 'pending' && (
                            <div className="pt-2 border-t border-border">
                              <Button
                                variant="ghost"
                                size="md"
                                className="w-full sm:w-auto min-h-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => cancelMutation.mutate(order.id)}
                                disabled={cancelMutation.isPending}
                              >
                                {t('orders.cancel')}
                              </Button>
                            </div>
                          )}
                        </div>
                      </>
                    )
                  })()}
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default OrdersPage
