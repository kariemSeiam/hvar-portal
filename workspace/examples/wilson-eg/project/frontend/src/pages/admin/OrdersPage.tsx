import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/Button'
import { Eye, Search, Filter, ChevronLeft, ChevronRight, Package, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
import { formatDate, formatOrderDisplayId } from '@/lib/utils'
import { useAdminOrders, useUpdateOrderStatus } from '@/hooks/useAdmin'
import type { Order as AdminOrder } from '@/hooks/useAdmin'
import { useToast } from '@/hooks/useToast'

type OrderStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

const statusConfig: Record<
  Exclude<OrderStatus, 'all'>,
  { labelAr: string; labelEn: string; className: string }
> = {
  pending: {
    labelAr: 'قيد الانتظار',
    labelEn: 'Pending',
    className:
      'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400 border-warning-200 dark:border-warning-800',
  },
  processing: {
    labelAr: 'جاري التجهيز',
    labelEn: 'Processing',
    className:
      'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400 border-info-200 dark:border-info-800',
  },
  shipped: {
    labelAr: 'تم الشحن',
    labelEn: 'Shipped',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
  delivered: {
    labelAr: 'تم التوصيل',
    labelEn: 'Delivered',
    className:
      'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400 border-success-200 dark:border-success-800',
  },
  cancelled: {
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
    className:
      'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400 border-danger-200 dark:border-danger-800',
  },
}

const filterOptions: { value: OrderStatus; labelAr: string; labelEn: string }[] = [
  { value: 'all', labelAr: 'الكل', labelEn: 'All' },
  { value: 'pending', labelAr: 'قيد الانتظار', labelEn: 'Pending' },
  { value: 'processing', labelAr: 'جاري التجهيز', labelEn: 'Processing' },
  { value: 'shipped', labelAr: 'تم الشحن', labelEn: 'Shipped' },
  { value: 'delivered', labelAr: 'تم التوصيل', labelEn: 'Delivered' },
  { value: 'cancelled', labelAr: 'ملغي', labelEn: 'Cancelled' },
]

const OrdersPage = () => {
  const { t, language, dir, isRTL } = useLanguage()
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [modalStatus, setModalStatus] = useState<AdminOrder['status'] | ''>('')

  const filters: Record<string, string> = {
    page: String(currentPage),
    perPage: '20',
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(searchQuery && { search: searchQuery }),
  }
  const { data, isLoading, error } = useAdminOrders(filters)
  const updateStatus = useUpdateOrderStatus()

  const orders = data?.orders ?? []
  const totalPages = data?.pages ?? 1
  const total = data?.total ?? 0

  useEffect(() => {
    if (selectedOrder) setModalStatus(selectedOrder.status)
  }, [selectedOrder])

  const getStatusBadge = (status: Exclude<OrderStatus, 'all'>) => {
    const config = statusConfig[status]
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
      >
        {language === 'ar' ? config.labelAr : config.labelEn}
      </span>
    )
  }

  const getItemDisplayName = (item: { productName?: string; productId?: string }) => {
    return item.productName ?? item.productId ?? '—'
  }

  const handleUpdateStatus = () => {
    if (!selectedOrder || !modalStatus) return
    updateStatus.mutate(
      { id: selectedOrder.id, status: modalStatus as AdminOrder['status'] },
      {
        onSuccess: () => {
          setSelectedOrder((prev) => (prev ? { ...prev, status: modalStatus as AdminOrder['status'] } : null))
          setModalStatus('')
          toast({ title: language === 'ar' ? 'تم تحديث الحالة' : 'Status updated' })
        },
        onError: (e) => {
          toast({ title: e?.message ?? (language === 'ar' ? 'فشل التحديث' : 'Update failed'), variant: 'destructive' })
        },
      }
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-destructive">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-wide py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-h2 font-bold text-foreground">
              {language === 'ar' ? 'إدارة الطلبات' : 'Orders Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar'
                ? 'عرض وإدارة جميع طلبات المتجر'
                : 'View and manage all store orders'}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute top-1/2 start-3 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder={
                    language === 'ar'
                      ? 'ابحث برقم الطلب أو اسم العميل...'
                      : 'Search by order ID or customer...'
                  }
                  aria-label={language === 'ar' ? 'بحث' : 'Search'}
                  className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  dir={dir}
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value)
                      setCurrentPage(1)
                    }}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === option.value
                        ? 'bg-gold-500 text-stone-900 shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-gold-100 hover:text-gold-800 dark:hover:bg-gold-900/20 dark:hover:text-gold-400'
                    }`}
                  >
                    {language === 'ar' ? option.labelAr : option.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-gold-500" />
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-start px-6 py-4 text-sm font-semibold text-foreground">
                          {language === 'ar' ? 'رقم الطلب' : 'Order #'}
                        </th>
                        <th className="text-start px-6 py-4 text-sm font-semibold text-foreground">
                          {language === 'ar' ? 'العميل' : 'Customer'}
                        </th>
                        <th className="text-start px-6 py-4 text-sm font-semibold text-foreground">
                          {language === 'ar' ? 'التاريخ' : 'Date'}
                        </th>
                        <th className="text-start px-6 py-4 text-sm font-semibold text-foreground">
                          {language === 'ar' ? 'المنتجات' : 'Items'}
                        </th>
                        <th className="text-start px-6 py-4 text-sm font-semibold text-foreground">
                          {language === 'ar' ? 'الإجمالي' : 'Total'}
                        </th>
                        <th className="text-start px-6 py-4 text-sm font-semibold text-foreground">
                          {language === 'ar' ? 'الحالة' : 'Status'}
                        </th>
                        <th className="text-start px-6 py-4 text-sm font-semibold text-foreground">
                          {language === 'ar' ? 'إجراءات' : 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                            {language === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
                          </td>
                        </tr>
                      ) : (
                        orders.map((order) => (
                          <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-mono text-sm font-medium text-foreground tabular-nums">
                                {formatOrderDisplayId(order.id)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-foreground">{order.customerName}</p>
                                <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {formatDate(order.createdAt, language === 'ar' ? 'ar-EG' : 'en-US')}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-foreground">{order.items?.length ?? 0}</span>
                              <span className="text-sm text-muted-foreground ms-1">
                                {language === 'ar' ? 'منتج' : order.items?.length === 1 ? 'item' : 'items'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-gold-600">
                                {Number(order.total).toLocaleString()} {t('common.egp')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(order.status as Exclude<OrderStatus, 'all'>)}
                            </td>
                            <td className="px-6 py-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setModalStatus(order.status)
                                }}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                {language === 'ar' ? 'عرض' : 'View'}
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
              </div>

              <div className="md:hidden p-4 space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {language === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-card rounded-xl border border-border p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-sm font-medium text-foreground tabular-nums">{formatOrderDisplayId(order.id)}</p>
                          <p className="font-medium text-foreground mt-1">{order.customerName}</p>
                        </div>
                        {getStatusBadge(order.status as Exclude<OrderStatus, 'all'>)}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">{language === 'ar' ? 'التاريخ' : 'Date'}</p>
                          <p className="text-foreground">
                            {formatDate(order.createdAt, language === 'ar' ? 'ar-EG' : 'en-US')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{language === 'ar' ? 'المنتجات' : 'Items'}</p>
                          <p className="text-foreground">
                            {order.items?.length ?? 0} {language === 'ar' ? 'منتج' : 'items'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {language === 'ar' ? 'الإجمالي' : 'Total'}
                          </p>
                          <p className="font-semibold text-gold-600">
                            {Number(order.total).toLocaleString()} {t('common.egp')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setModalStatus(order.status)
                          }}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar'
                      ? `صفحة ${currentPage} من ${totalPages} (${total} طلب)`
                      : `Page ${currentPage} of ${totalPages} (${total} orders)`}
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

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir} aria-describedby={undefined}>
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</DialogTitle>
                <p className="text-sm text-muted-foreground font-mono mt-1">{selectedOrder.id}</p>
              </DialogHeader>

              <div className="mt-4 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <span className="text-sm text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</span>
                <div className="flex items-center gap-2">
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as AdminOrder['status'])}
                    aria-label={language === 'ar' ? 'الحالة' : 'Status'}
                    className="min-h-[44px] rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm hover:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 focus:shadow-gold-sm transition-all dark:bg-card dark:border-stone-700"
                  >
                    {(Object.keys(statusConfig) as Array<Exclude<OrderStatus, 'all'>>).map((s) => (
                      <option key={s} value={s}>
                        {language === 'ar' ? statusConfig[s].labelAr : statusConfig[s].labelEn}
                      </option>
                    ))}
                  </select>
                  {getStatusBadge(selectedOrder.status as Exclude<OrderStatus, 'all'>)}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-foreground">
                  {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">{language === 'ar' ? 'الاسم' : 'Name'}</p>
                    <p className="text-foreground font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{language === 'ar' ? 'الهاتف' : 'Phone'}</p>
                    <p className="text-foreground">{selectedOrder.customerPhone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  {language === 'ar' ? 'المنتجات المطلوبة' : 'Order Items'}
                </h3>
                <div className="bg-muted/50 rounded-lg divide-y divide-border">
                  {(selectedOrder.items ?? []).map((item: { productName?: string; productId?: string; quantity?: number; price?: number }, index: number) => (
                    <div key={`${item.productId ?? index}-${index}`} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gold-100 dark:bg-gold-900/30 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground/60" aria-hidden />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{getItemDisplayName(item)}</p>
                          <p className="text-sm text-muted-foreground">
                            {Number(item.price ?? 0).toLocaleString()} {t('common.egp')} x {item.quantity ?? 0}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-foreground">
                        {((item.price ?? 0) * (item.quantity ?? 0)).toLocaleString()} {t('common.egp')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gold-50 dark:bg-gold-900/10 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {language === 'ar' ? 'تاريخ الطلب' : 'Order Date'}
                  </span>
                  <span className="text-foreground">
                    {formatDate(selectedOrder.createdAt, language === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </div>
                <div className="h-px bg-gold-200 dark:bg-gold-800 my-2" />
                <div className="flex justify-between">
                  <span className="font-bold text-foreground">
                    {language === 'ar' ? 'الإجمالي' : 'Total'}
                  </span>
                  <span className="text-xl font-bold text-gold-600">
                    {Number(selectedOrder.total).toLocaleString()} {t('common.egp')}
                  </span>
                </div>
              </div>
              </div>

              <DialogFooter className="flex-col-reverse sm:flex-row gap-3 mt-6">
                <Button variant="outline" onClick={() => setSelectedOrder(null)} className="w-full sm:w-auto min-h-[44px]">
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
                <Button
                  className="w-full sm:w-auto min-h-[44px] bg-gold-500 hover:bg-gold-600 text-stone-900"
                  onClick={handleUpdateStatus}
                  disabled={!modalStatus || updateStatus.isPending}
                >
                  {updateStatus.isPending
                    ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...')
                    : language === 'ar'
                      ? 'تحديث الحالة'
                      : 'Update Status'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrdersPage
