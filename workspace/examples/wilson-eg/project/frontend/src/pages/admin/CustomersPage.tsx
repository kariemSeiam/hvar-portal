import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/Button'
import { Search, Eye, Loader2, ChevronLeft, ChevronRight, Package, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
import { cn, formatPrice, formatDate, formatOrderDisplayId } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useAdminCustomers, useAdminOrdersByCustomer } from '@/hooks/useAdmin'
import type { Customer as AdminCustomer, Order as AdminOrder } from '@/hooks/useAdmin'

const translations = {
  ar: {
    title: 'إدارة العملاء',
    subtitle: 'عرض وإدارة بيانات العملاء',
    search: 'البحث بالاسم أو رقم الهاتف...',
    noResults: 'لا يوجد عملاء مطابقين',
    totalCustomers: 'إجمالي العملاء',
    columns: {
      name: 'الاسم',
      phone: 'الهاتف',
      ordersCount: 'عدد الطلبات',
      totalSpent: 'إجمالي المشتريات',
      joinedDate: 'تاريخ التسجيل',
      actions: 'الإجراءات',
    },
    viewDetails: 'عرض التفاصيل',
    closeModal: 'إغلاق',
    customerDetails: 'تفاصيل العميل',
    customerInfo: 'بيانات العميل',
    address: 'العنوان',
    statistics: 'الإحصائيات',
    customerOrders: 'طلبات العميل',
    noOrders: 'لا توجد طلبات',
    orderId: 'رقم الطلب',
    orderDate: 'التاريخ',
    orderStatus: 'الحالة',
    orderItems: 'المنتجات',
    viewOrder: 'عرض الطلب',
    viewAllOrders: 'عرض كل الطلبات',
    copyPhone: 'نسخ الرقم',
    copied: 'تم النسخ',
    pageOf: 'صفحة',
    of: 'من',
    noAddress: 'لم يُضف عنوان بعد',
    statusPending: 'قيد الانتظار',
    statusProcessing: 'جاري التجهيز',
    statusShipped: 'تم الشحن',
    statusDelivered: 'تم التوصيل',
    statusCancelled: 'ملغي',
  },
  en: {
    title: 'Customers Management',
    subtitle: 'View and manage customer data',
    search: 'Search by name or phone...',
    noResults: 'No matching customers',
    totalCustomers: 'Total Customers',
    columns: {
      name: 'Name',
      phone: 'Phone',
      ordersCount: 'Orders',
      totalSpent: 'Total Spent',
      joinedDate: 'Joined',
      actions: 'Actions',
    },
    viewDetails: 'View Details',
    closeModal: 'Close',
    customerDetails: 'Customer Details',
    customerInfo: 'Customer Information',
    address: 'Address',
    statistics: 'Statistics',
    customerOrders: 'Customer Orders',
    noOrders: 'No orders yet',
    orderId: 'Order',
    orderDate: 'Date',
    orderStatus: 'Status',
    orderItems: 'Items',
    viewOrder: 'View order',
    viewAllOrders: 'View all orders',
    copyPhone: 'Copy phone',
    copied: 'Copied',
    pageOf: 'Page',
    of: 'of',
    noAddress: 'No address added yet',
    statusPending: 'Pending',
    statusProcessing: 'Processing',
    statusShipped: 'Shipped',
    statusDelivered: 'Delivered',
    statusCancelled: 'Cancelled',
  },
}

type OrderStatusKey = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

const statusConfig: Record<OrderStatusKey, { labelAr: string; labelEn: string; className: string }> = {
  pending: {
    labelAr: 'قيد الانتظار',
    labelEn: 'Pending',
    className: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400 border border-warning-200 dark:border-warning-800',
  },
  processing: {
    labelAr: 'جاري التجهيز',
    labelEn: 'Processing',
    className: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400 border border-info-200 dark:border-info-800',
  },
  shipped: {
    labelAr: 'تم الشحن',
    labelEn: 'Shipped',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  },
  delivered: {
    labelAr: 'تم التوصيل',
    labelEn: 'Delivered',
    className: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400 border border-success-200 dark:border-success-800',
  },
  cancelled: {
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
    className: 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400 border border-danger-200 dark:border-danger-800',
  },
}

function formatAddress(addr: { governorate?: string; district?: string; details?: string }): string {
  const parts = [addr.governorate, addr.district, addr.details].filter(Boolean)
  return parts.length ? parts.join('، ') : ''
}

const CustomersPage = () => {
  const { language, dir, isRTL } = useLanguage()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null)
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set())
  const [copiedPhone, setCopiedPhone] = useState(false)

  const t = translations[language as keyof typeof translations]

  const copyPhoneToClipboard = (phone: string) => {
    navigator.clipboard.writeText(phone).then(
      () => {
        setCopiedPhone(true)
        toast({ title: t.copied })
        setTimeout(() => setCopiedPhone(false), 2000)
      },
      () => toast({ title: language === 'ar' ? 'فشل النسخ' : 'Copy failed', variant: 'destructive' })
    )
  }

  const { data: ordersData, isLoading: ordersLoading } = useAdminOrdersByCustomer(selectedCustomer?.id ?? null)
  const customerOrders = ordersData?.orders ?? []

  const toggleOrderExpand = (id: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filters: Record<string, string> = {
    page: String(currentPage),
    perPage: '20',
    ...(searchQuery && { search: searchQuery }),
  }
  const { data, isLoading, error } = useAdminCustomers(filters)

  const customers = data?.customers ?? []
  const totalPages = data?.pages ?? 1
  const total = data?.total ?? 0

  const handleCloseModal = () => setSelectedCustomer(null)

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-destructive">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <div className="container-wide py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-h2 font-bold text-foreground">{t.title}</h1>
            <p className="text-muted-foreground mt-1">{t.subtitle}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t.totalCustomers}:</span>
              <span className="text-lg font-bold text-gold-600 dark:text-gold-400 tabular-nums">{total}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="relative max-w-md">
              <Search className="absolute top-1/2 start-3 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder={t.search}
                aria-label={t.search}
                className="w-full py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent ps-10 pe-4 dark:bg-stone-800 dark:text-foreground dark:border-stone-700"
                dir={dir}
              />
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-gold-500" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t.noResults}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-6 py-4 text-sm font-semibold text-foreground text-start">{t.columns.name}</th>
                      <th className="px-6 py-4 text-sm font-semibold text-foreground text-start">{t.columns.phone}</th>
                      <th className="px-6 py-4 text-sm font-semibold text-foreground text-start whitespace-nowrap">
                        {t.columns.ordersCount}
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-foreground text-start whitespace-nowrap">
                        {t.columns.totalSpent}
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-foreground text-start whitespace-nowrap">
                        {t.columns.joinedDate}
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-foreground text-center">{t.columns.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-foreground">{customer.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono tabular-nums">
                              …{customer.id.slice(-8)}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono direction-ltr tabular-nums">{customer.phone}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 rounded-full text-sm font-medium bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 tabular-nums">
                            {customer.ordersCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gold-600 dark:text-gold-400 tabular-nums">
                          {formatPrice(customer.totalSpent)}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(customer.joinedAt, language === 'ar' ? 'ar-EG' : 'en-US')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCustomer(customer)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              {t.viewDetails}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar'
                      ? `${t.pageOf} ${currentPage} ${t.of} ${totalPages} (${total})`
                      : `${t.pageOf} ${currentPage} ${t.of} ${totalPages} (${total} total)`}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-xl w-full max-h-[90vh] overflow-y-auto" dir={dir} aria-describedby={undefined}>
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>{t.customerDetails}</DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    {t.customerInfo}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-sm text-muted-foreground shrink-0">{t.columns.name}</span>
                      <span className="text-sm font-medium text-foreground text-end">{selectedCustomer.name}</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-sm text-muted-foreground shrink-0">{t.columns.phone}</span>
                      <div className="flex items-center gap-2 min-w-0 justify-end">
                        <span className="text-sm font-medium font-mono direction-ltr tabular-nums">
                          {selectedCustomer.phone}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8"
                          onClick={() => copyPhoneToClipboard(selectedCustomer.phone)}
                          aria-label={t.copyPhone}
                        >
                          {copiedPhone ? (
                            <Check className="h-4 w-4 text-success-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-sm text-muted-foreground shrink-0">{t.address}</span>
                      <span className="text-sm font-medium text-foreground text-end max-w-[60%]">
                        {selectedCustomer.addresses && selectedCustomer.addresses.length > 0
                          ? selectedCustomer.addresses.map(formatAddress).filter(Boolean).join(' · ') || t.noAddress
                          : t.noAddress}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    {t.statistics}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gold-50 dark:bg-gold-900/20 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-gold-600 dark:text-gold-400 tabular-nums">
                        {selectedCustomer.ordersCount}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{t.columns.ordersCount}</p>
                    </div>
                    <div className="bg-gold-50 dark:bg-gold-900/20 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-gold-600 dark:text-gold-400 tabular-nums">
                        {formatPrice(selectedCustomer.totalSpent)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{t.columns.totalSpent}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t.columns.joinedDate}</span>
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(selectedCustomer.joinedAt, language === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                </div>

                {/* Customer Orders — real backend integration */}
                <div className="pt-4 border-t border-border">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    {t.customerOrders}
                  </h3>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6">{t.noOrders}</p>
                  ) : (
                    <div className="space-y-3 min-h-[8rem] max-h-[18rem] overflow-y-auto pr-1">
                      {customerOrders.map((order: AdminOrder) => {
                        const isExpanded = expandedOrderIds.has(order.id)
                        const statusKey = (order.status || 'pending') as OrderStatusKey
                        const status = statusConfig[statusKey] ?? statusConfig.pending
                        const items = order.items ?? []
                        return (
                          <div
                            key={order.id}
                            className="rounded-xl border-2 border-border bg-muted/20 hover:border-gold-500/30 transition-colors overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => toggleOrderExpand(order.id)}
                              className="w-full flex items-center justify-between gap-3 p-4 text-start hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex flex-col items-start gap-1 min-w-0">
                                <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                                  {formatOrderDisplayId(order.id)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(order.createdAt, language === 'ar' ? 'ar-EG' : 'en-US')}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${status.className}`}
                                >
                                  {language === 'ar' ? status.labelAr : status.labelEn}
                                </span>
                                <span className="text-sm font-bold text-gold-600 dark:text-gold-400 tabular-nums">
                                  {formatPrice(Number(order.total ?? 0))}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="border-t border-border bg-background/60 p-4 space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  {t.orderItems}
                                </p>
                                <div className="divide-y divide-border">
                                  {items.map(
                                    (
                                      item: {
                                        productName?: string
                                        variant?: string
                                        size?: string
                                        quantity?: number
                                        price?: number
                                      },
                                      idx: number
                                    ) => (
                                      <div
                                        key={`${order.id}-${idx}`}
                                        className="py-3 flex items-center justify-between gap-4"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-10 h-10 bg-gold-100 dark:bg-gold-900/30 rounded-lg flex items-center justify-center shrink-0">
                                            <Package className="h-5 w-5 text-muted-foreground/60" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="font-medium text-foreground text-sm truncate">
                                              {item.productName ?? '—'}
                                            </p>
                                            {(item.variant || item.size) && (
                                              <p className="text-xs text-muted-foreground">
                                                {[item.variant, item.size].filter(Boolean).join(' · ')}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-end shrink-0">
                                          <p className="text-xs text-muted-foreground">
                                            {Number(item.price ?? 0).toLocaleString()} × {item.quantity ?? 0}
                                          </p>
                                          <p className="font-semibold text-foreground text-sm">
                                            {formatPrice((item.price ?? 0) * (item.quantity ?? 1))}
                                          </p>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                                <Link
                                  to="/admin/orders"
                                  className="inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700 dark:text-gold-400"
                                >
                                  {t.viewOrder}
                                  <ChevronRight className={cn('h-4 w-4 rtl:rotate-180')} />
                                </Link>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-wrap gap-2">
                {customerOrders.length > 0 && (
                  <Button variant="default" asChild className="min-h-touch bg-gold-500 hover:bg-gold-600 text-stone-900">
                    <Link to="/admin/orders">{t.viewAllOrders}</Link>
                  </Button>
                )}
                <Button variant="outline" onClick={handleCloseModal} className="min-h-touch">
                  {t.closeModal}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomersPage
