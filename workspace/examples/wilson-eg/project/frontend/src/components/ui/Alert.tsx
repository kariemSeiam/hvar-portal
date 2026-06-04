import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-xl border-2 p-4 [&>svg~*]:ps-7 [&>svg]:absolute [&>svg]:start-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'border-border bg-background text-foreground hover:border-primary/20',
        destructive:
          'border-danger-500/50 bg-danger-50 text-danger-900 dark:border-danger-500 dark:bg-danger-950/30 dark:text-danger-50',
        success:
          'border-success-500/50 bg-success-50 text-success-900 dark:border-success-500 dark:bg-success-950/30 dark:text-success-50',
        warning:
          'border-warning-500/50 bg-warning-50 text-warning-900 dark:border-warning-500 dark:bg-warning-950/30 dark:text-warning-50',
        info: 'border-info-500/50 bg-info-50 text-info-900 dark:border-info-500 dark:bg-info-950/30 dark:text-info-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const iconMap = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
}

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> & { showIcon?: boolean }
>(({ className, variant = 'default', showIcon = true, children, ...props }, ref) => {
  const Icon = iconMap[variant || 'default']
  return (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {showIcon && <Icon className="h-4 w-4" />}
      {children}
    </div>
  )
})
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} />
  )
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
  )
)
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription, alertVariants }
