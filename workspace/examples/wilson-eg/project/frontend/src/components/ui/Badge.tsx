import { HTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-gold-500 text-stone-900 hover:bg-gold-400',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'text-foreground border-2 border-border bg-transparent hover:border-primary/30',
        success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
        warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
        danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
        info: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-400',
        pending: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
        processing: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-400',
        shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        delivered: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
        cancelled: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => {
  return <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
})
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
export type { BadgeProps }
