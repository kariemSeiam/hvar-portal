import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Package,
  Loader2,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatPrice, formatDate, formatOrderDisplayId } from '@/lib/utils'
import { analyticsApi, adminOrdersApi } from '@/services/api'
import type { OrderStatus } from '@/types'

type DashboardPeriod = 'today' | 'week' | 'month' | 'year' | 'all'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ElementType
  iconBgClass: string
}

const StatCard = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconBgClass,
}: StatCardProps) => {
  const isPositive = change !== undefined && change >= 0

  return (
    <Card className="relative overflow-hidden">
      <CardBody className="p-6">
        <div className="flex items-center justify-between rtl:flex-row-reverse">
          <div className="text-start">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold text-foreground font-cairo">{value}</p>
            {change !== undefined && (
              <div className="mt-2 flex items-center gap-1 rtl:flex-row-reverse">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-success-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger-500" />
                )}
                <span
                  className={`text-sm font-medium ${isPositive ? 'text-success-500' : 'text-danger-500'}`}
                >
                  {isPositive ? '+' : ''}
                  {change}%
                </span>
                {changeLabel && (
                  <span className="text-sm text-muted-foreground">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconBgClass}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

const getStatusBadgeVariant = (
  status: OrderStatus
): 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' => {
  return status
}

const DashboardPage = () => {
  const { language } = useLanguage()
  const [period, setPeriod] = useState<DashboardPeriod>('month')

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['admin', 'analytics', 'dashboard', period],
    queryFn: () => analyticsApi.getDashboard(period),
  })

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin', 'orders', 'recent'],
    queryFn: () => adminOrdersApi.getAll({ page: 1, perPage: 5 }),
  })

  const translations = {
    ar: {
      totalSales: 'إجمالي المبيعات',
      orders: 'الطلبات',
      customers: 'العملاء',
      pendingOrders: 'الطلبات المعلقة',
      vsLastMonth: 'مقارنة بالشهر الماضي',
      recentOrders: 'الطلبات الأخيرة',
      topProducts: 'المنتجات الأكثر مبيعاً',
      revenueChart: 'رسم بياني للإيرادات',
      order: 'طلب',
      customer: 'عميل',
      pending: 'قيد الانتظار',
      processing: 'جاري المعالجة',
      shipped: 'تم الشحن',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
      viewAll: 'عرض الكل',
      ordersCount: 'عدد الطلبات',
      revenue: 'الإيرادات',
      chartPlaceholder: 'سيتم إضافة الرسم البياني قريباً',
      sales: 'مبيعات',
    },
    en: {
      totalSales: 'Total Sales',
      orders: 'Orders',
      customers: 'Customers',
      pendingOrders: 'Pending Orders',
      vsLastMonth: 'vs last month',
      recentOrders: 'Recent Orders',
      topProducts: 'Top Products',
      revenueChart: 'Revenue Chart',
      order: 'Order',
      customer: 'Customer',
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      viewAll: 'View All',
      ordersCount: 'Orders',
      revenue: 'Revenue',
      chartPlaceholder: 'Chart coming soon',
      sales: 'Sales',
    },
  }

  const tr = translations[language]

  const orderCountChange =
    analytics && analytics.previousOrderCount
      ? Math.round(((analytics.orderCount - analytics.previousOrderCount) / analytics.previousOrderCount) * 100)
      : undefined
  const avgOrderValueChange =
    analytics && analytics.previousAvgOrderValue
      ? Math.round(((analytics.avgOrderValue - analytics.previousAvgOrderValue) / analytics.previousAvgOrderValue) * 100)
      : undefined

  const stats = analytics
    ? [
        {
          title: tr.totalSales,
          value: formatPrice(analytics.totalSales),
          change: undefined as number | undefined,
          changeLabel: tr.vsLastMonth,
          icon: DollarSign,
          iconBgClass: 'bg-gold-500',
        },
        {
          title: tr.orders,
          value: analytics.orderCount,
          change: orderCountChange,
          changeLabel: tr.vsLastMonth,
          icon: ShoppingCart,
          iconBgClass: 'bg-success-500',
        },
        {
          title: tr.customers,
          value: analytics.retention?.totalCustomers ?? 0,
          change: undefined as number | undefined,
          changeLabel: tr.vsLastMonth,
          icon: Users,
          iconBgClass: 'bg-info-500',
        },
        {
          title: tr.pendingOrders,
          value: analytics.ordersByStatus?.pending ?? 0,
          change: avgOrderValueChange,
          changeLabel: tr.vsLastMonth,
          icon: Clock,
          iconBgClass: 'bg-warning-500',
        },
      ]
    : []

  const recentOrders =
    ordersData?.orders?.map((o) => ({
      id: o.id,
      customer: o.userName,
      date: o.createdAt?.split('T')[0] ?? '',
      total: o.total,
      status: o.status as OrderStatus,
    })) ?? []

  const topProducts =
    analytics?.topProducts?.map((p) => ({
      id: String(p.id),
      name: p.name,
      sales: p.quantity ?? 0,
      revenue: p.revenue ?? 0,
    })) ?? []

  const revenueData = analytics?.revenueChart ?? []
  const maxRevenue = revenueData.length ? Math.max(...revenueData.map((d) => Number(d.revenue))) : 1

  const getStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      pending: tr.pending,
      processing: tr.processing,
      shipped: tr.shipped,
      delivered: tr.delivered,
      cancelled: tr.cancelled,
    }
    return labels[status]
  }

  const formatChartDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return language === 'ar' ? d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const periodOptions: { value: DashboardPeriod; labelAr: string; labelEn: string }[] = [
    { value: 'today', labelAr: 'اليوم', labelEn: 'Today' },
    { value: 'week', labelAr: 'أسبوع', labelEn: 'Week' },
    { value: 'month', labelAr: 'شهر', labelEn: 'Month' },
    { value: 'year', labelAr: 'سنة', labelEn: 'Year' },
    { value: 'all', labelAr: 'الكل', labelEn: 'All' },
  ]

  if (analyticsError) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-destructive font-tajawal">{language === 'ar' ? 'حدث خطأ أثناء تحميل البيانات' : 'Failed to load dashboard data'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-wide py-6 lg:py-8 space-y-6">
        {/* Page Header */}
        <div className={`flex flex-wrap items-center justify-between gap-4 rtl:flex-row-reverse`}>
          <h1 className="text-2xl font-bold text-foreground font-cairo">
            {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <div className={`flex gap-1 rtl:flex-row-reverse`}>
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-tajawal transition-colors ${
                  period === opt.value
                    ? 'bg-gold-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {language === 'ar' ? opt.labelAr : opt.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {analyticsLoading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i} className="relative overflow-hidden">
                <CardBody className="p-6 flex items-center justify-center min-h-[120px]">
                  <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
                </CardBody>
              </Card>
            ))
          ) : (
            stats.map((stat, index) => <StatCard key={index} {...stat} />)
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader
              className={`flex flex-row items-center justify-between rtl:flex-row-reverse`}
            >
              <CardTitle className="font-cairo">{tr.revenueChart}</CardTitle>
              {avgOrderValueChange !== undefined && (
                <div
                  className={`flex items-center gap-1 text-sm ${avgOrderValueChange >= 0 ? 'text-success-500' : 'text-danger-500'} rtl:flex-row-reverse`}
                >
                  {avgOrderValueChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{avgOrderValueChange >= 0 ? '+' : ''}{avgOrderValueChange}%</span>
                </div>
              )}
            </CardHeader>
            <CardBody>
              {analyticsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-gold-500" />
                </div>
              ) : revenueData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground font-tajawal">
                  {tr.chartPlaceholder}
                </div>
              ) : (
                <div className="h-64 flex items-end justify-between gap-2 px-4">
                  {revenueData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center">
                        <span className="text-xs text-muted-foreground mb-1 font-tajawal">
                          {formatPrice(Number(data.revenue))
                            .replace(language === 'ar' ? 'ج.م' : 'EGP', '')
                            .trim()}
                        </span>
                        <div
                          className="w-full max-w-[60px] bg-gradient-to-t from-gold-600 to-gold-400 rounded-t-lg transition-all duration-500 hover:from-gold-500 hover:to-gold-300 cursor-pointer group relative"
                          style={{ height: `${(Number(data.revenue) / maxRevenue) * 160}px` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-tajawal">
                            {tr.ordersCount}: {data.orders}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-tajawal">{formatChartDate(data.date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader
              className={`flex flex-row items-center justify-between rtl:flex-row-reverse`}
            >
              <CardTitle className="font-cairo">{tr.topProducts}</CardTitle>
              <Link
                to="/admin/products"
                className={`flex items-center gap-1 text-sm text-gold-500 hover:text-gold-600 transition-colors rtl:flex-row-reverse`}
              >
                <span>{tr.viewAll}</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardBody>
              {analyticsLoading ? (
                <div className="space-y-4 flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
                </div>
              ) : topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground font-tajawal py-4">{language === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>
              ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors rtl:flex-row-reverse`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-gold-600 font-cairo">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-start">
                      <p className="text-sm font-medium text-foreground truncate font-tajawal">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-tajawal">
                        {product.sales} {tr.sales}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-semibold text-foreground font-cairo">
                        {formatPrice(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Recent Orders Table */}
        <Card>
          <CardHeader
            className={`flex flex-row items-center justify-between rtl:flex-row-reverse`}
          >
            <CardTitle className="font-cairo">{tr.recentOrders}</CardTitle>
            <Link
              to="/admin/orders"
              className={`flex items-center gap-1 text-sm text-gold-500 hover:text-gold-600 transition-colors rtl:flex-row-reverse`}
            >
              <span>{tr.viewAll}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardBody>
            {ordersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-gold-500" />
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground font-tajawal py-8 text-center">{language === 'ar' ? 'لا توجد طلبات' : 'No orders'}</p>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b border-border rtl:flex-row-reverse`}>
                    <th
                      className={`pb-3 text-sm font-medium text-muted-foreground font-tajawal text-start`}
                    >
                      {language === 'ar' ? 'رقم الطلب' : 'Order ID'}
                    </th>
                    <th
                      className={`pb-3 text-sm font-medium text-muted-foreground font-tajawal text-start`}
                    >
                      {tr.customer}
                    </th>
                    <th
                      className={`pb-3 text-sm font-medium text-muted-foreground font-tajawal text-start`}
                    >
                      {language === 'ar' ? 'التاريخ' : 'Date'}
                    </th>
                    <th
                      className={`pb-3 text-sm font-medium text-muted-foreground font-tajawal text-start`}
                    >
                      {language === 'ar' ? 'الإجمالي' : 'Total'}
                    </th>
                    <th
                      className={`pb-3 text-sm font-medium text-muted-foreground font-tajawal text-start`}
                    >
                      {language === 'ar' ? 'الحالة' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 text-start">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground font-mono tabular-nums">
                            {formatOrderDisplayId(order.id)}
                          </span>
                          <Package className="h-4 w-4 text-gold-500 shrink-0" aria-hidden />
                        </div>
                      </td>
                      <td className={`py-4 text-start`}>
                        <span className="text-sm text-foreground font-tajawal">
                          {order.customer}
                        </span>
                      </td>
                      <td className={`py-4 text-start`}>
                        <span className="text-sm text-muted-foreground font-tajawal">
                          {formatDate(order.date, language === 'ar' ? 'ar-EG' : 'en-US')}
                        </span>
                      </td>
                      <td className={`py-4 text-start`}>
                        <span className="text-sm font-semibold text-foreground font-cairo">
                          {formatPrice(order.total)}
                        </span>
                      </td>
                      <td className={`py-4 text-start`}>
                        <Badge
                          variant={getStatusBadgeVariant(order.status)}
                          className="font-tajawal"
                        >
                          {getStatusLabel(order.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
