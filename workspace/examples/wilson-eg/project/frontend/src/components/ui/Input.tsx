import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border-2 border-input bg-background px-4 py-2.5',
          'text-sm text-foreground placeholder:text-muted-foreground',
          'transition-all duration-200',
          'hover:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 focus:border-primary focus:shadow-gold-sm',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-card dark:border-stone-700 dark:hover:border-primary/30',
          error && 'border-destructive focus:ring-destructive focus:border-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
export type { InputProps }
