import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  asChild?: boolean
  pill?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, pill = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.98]',

          variant === 'default' && [
            'bg-primary text-primary-foreground',
            'hover:bg-gold-400 hover:shadow-gold-sm dark:hover:shadow-gold-sm',
          ],
          variant === 'outline' && [
            'border-2 border-primary text-primary bg-transparent',
            'hover:bg-primary hover:text-primary-foreground hover:shadow-gold-sm',
          ],
          variant === 'ghost' && [
            'text-foreground bg-transparent',
            'hover:bg-primary/10 dark:hover:bg-primary/15',
          ],
          variant === 'destructive' && [
            'bg-destructive text-destructive-foreground',
            'hover:brightness-95',
          ],
          variant === 'link' && [
            'text-primary underline-offset-4 hover:underline',
          ],

          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2.5 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          size === 'icon' && 'p-2',
          pill && 'rounded-full',

          className
        )}
        {...props}
      >
        {children}
      </Comp>
    )
  }
) as React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>> & {
  displayName: string
}

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
