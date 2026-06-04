/**
 * Horizontal order journey — Wilson: completed = gold studs, warm typography, RTL.
 * Studs = solid done state; pending = ring only. Inline inside expanded card.
 */
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/services/api'
import { Skeleton } from '@/components/ui/Skeleton'
import { Check, Circle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const statusLabels: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  processing: { ar: 'قيد التجهيز', en: 'Processing' },
  shipped: { ar: 'تم الشحن', en: 'Shipped' },
  delivered: { ar: 'تم التوصيل', en: 'Delivered' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
}

interface OrderTrackingTimelineProps {
  orderId: string
  isVisible: boolean
}

export function OrderTrackingTimeline({ orderId, isVisible }: OrderTrackingTimelineProps) {
  const { language } = useLanguage()

  const { data, isLoading } = useQuery({
    queryKey: ['order-track', orderId],
    queryFn: () => ordersApi.getTrack(orderId),
    enabled: isVisible && !!orderId,
  })

  const steps = data?.tracking_steps ?? []
  const isRTL = language === 'ar'

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (!isVisible) return null

  return (
    <div className="pt-4 border-t border-border mt-4">
      <h3 className="text-sm font-bold text-foreground font-cairo mb-4">
        {language === 'ar' ? 'رحلة الطلب' : 'Order journey'}
      </h3>
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden" role="status">
          <Skeleton className="h-28 w-[140px] shrink-0 rounded-xl" />
          <Skeleton className="h-28 w-[140px] shrink-0 rounded-xl" />
          <Skeleton className="h-28 w-[140px] shrink-0 rounded-xl" />
        </div>
      ) : steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا توجد مراحل بعد' : 'No steps yet'}</p>
      ) : (
        <div
          className={cn(
            'flex items-stretch overflow-x-auto overflow-y-hidden gap-0 pb-2',
            isRTL && 'flex-row-reverse'
          )}
          role="list"
          aria-label={language === 'ar' ? 'مراحل الطلب' : 'Order steps'}
        >
          {steps.map((step, i) => {
            const isCompleted = step.completed !== false
            const prevCompleted = i > 0 && steps[i - 1]?.completed !== false
            const label = language === 'ar' ? statusLabels[step.status]?.ar ?? step.status : statusLabels[step.status]?.en ?? step.status
            return (
              <div
                key={i}
                className={cn(
                  'flex flex-shrink-0 items-center min-w-0',
                  isRTL && 'flex-row-reverse'
                )}
                role="listitem"
              >
                {/* Connector: gold when previous step done — studied weight */}
                {i > 0 && (
                  <div
                    className={cn(
                      'h-1 flex-1 min-w-[20px] max-w-[40px] rounded-full transition-colors',
                      prevCompleted
                        ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]'
                        : 'bg-border'
                    )}
                    aria-hidden
                  />
                )}
                {/* Step card — completed = resolved (stud + subtle gold tint) */}
                <div
                  className={cn(
                    'flex flex-col items-center text-center flex-shrink-0 rounded-xl px-3 py-3 min-w-[100px] sm:min-w-[130px] max-w-[180px]',
                    'transition-colors hover:bg-muted/40',
                    isCompleted && 'bg-primary/5 border border-primary/10'
                  )}
                >
                  {/* Stud: completed = solid gold disc; pending = ring only */}
                  <div
                    className={cn(
                      'flex shrink-0 items-center justify-center rounded-full transition-all',
                      isCompleted
                        ? 'h-10 w-10 bg-primary text-primary-foreground border-2 border-primary shadow-[0_2px_12px_hsl(var(--primary)/0.4)]'
                        : 'h-10 w-10 border-2 border-border bg-card text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                    ) : (
                      <Circle className="h-3 w-3" strokeWidth={2} aria-hidden />
                    )}
                  </div>
                  {/* Status: done = weight; Wilson Cairo for AR */}
                  <p
                    className={cn(
                      'mt-2.5 text-xs font-cairo leading-tight',
                      isCompleted ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground'
                    )}
                  >
                    {label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {step.description}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground/90 tabular-nums font-sans leading-tight" dir="ltr">
                    {formatDate(step.timestamp)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
