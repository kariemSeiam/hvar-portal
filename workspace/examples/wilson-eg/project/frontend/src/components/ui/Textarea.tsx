import { forwardRef, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border-2 border-input bg-background px-4 py-3',
          'text-sm text-foreground placeholder:text-muted-foreground',
          'transition-all duration-200 resize-none',
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

Textarea.displayName = 'Textarea'

export { Textarea }
export type { TextareaProps }
