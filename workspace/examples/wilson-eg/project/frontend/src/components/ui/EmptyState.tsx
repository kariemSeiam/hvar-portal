import * as React from 'react'
import { PackageOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-12 text-center hover:border-primary/20 transition-colors',
        className
      )}
      {...props}
    >
      {icon ?? (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/15">
          <PackageOpen className="h-8 w-8 text-primary/70" />
        </div>
      )}
      {title && <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>}
      {action}
      {children}
    </div>
  )
)
EmptyState.displayName = 'EmptyState'

export { EmptyState }
