import { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Column<T> {
  key: keyof T | string
  headerAr: string
  headerEn: string
  render?: (item: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  emptyMessageAr?: string
  emptyMessageEn?: string
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  emptyMessageAr = 'لا توجد بيانات',
  emptyMessageEn = 'No data available',
}: DataTableProps<T>) {
  const { language, isRTL } = useLanguage()
  const isArabic = language === 'ar'

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  'px-4 py-3 text-start text-sm font-semibold text-foreground font-cairo',
                  column.className
                )}
              >
                {isArabic ? column.headerAr : column.headerEn}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-muted-foreground font-tajawal"
              >
                {isArabic ? emptyMessageAr : emptyMessageEn}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={keyExtractor(item)} className="hover:bg-muted/20 transition-colors">
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={cn('px-4 py-3 text-sm', column.className)}
                  >
                    {column.render
                      ? column.render(item)
                      : String((item as Record<string, unknown>)[column.key as string] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground font-tajawal">
            {isArabic
              ? `صفحة ${currentPage} من ${totalPages}`
              : `Page ${currentPage} of ${totalPages}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              <span className="ms-1">{isArabic ? 'السابق' : 'Prev'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <span className="me-1">{isArabic ? 'التالي' : 'Next'}</span>
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  icon: ReactNode
  labelAr: string
  labelEn: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  iconBgColor?: string
}

export function StatCard({
  icon,
  labelAr,
  labelEn,
  value,
  trend,
  iconBgColor = 'bg-gold-100 dark:bg-gold-900/30',
}: StatCardProps) {
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className={cn('p-3 rounded-lg', iconBgColor)}>{icon}</div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full font-tajawal',
              trend.isPositive
                ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                : 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
            )}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground font-cairo">{value}</p>
        <p className="text-sm text-muted-foreground font-tajawal mt-1">
          {isArabic ? labelAr : labelEn}
        </p>
      </div>
    </div>
  )
}

interface AdminSearchProps {
  value: string
  onChange: (value: string) => void
  placeholderAr?: string
  placeholderEn?: string
}

export function AdminSearch({
  value,
  onChange,
  placeholderAr = 'ابحث...',
  placeholderEn = 'Search...',
}: AdminSearchProps) {
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  return (
    <div className="relative">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isArabic ? placeholderAr : placeholderEn}
        className="ps-10"
      />
    </div>
  )
}
