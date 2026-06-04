import { forwardRef, ComponentPropsWithoutRef, ElementRef } from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

interface SwitchProps extends ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string
}

const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || `switch-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="flex items-center justify-between gap-3">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground cursor-pointer select-none"
          >
            {label}
          </label>
        )}
        <SwitchPrimitive.Root
          className={cn(
            'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
            'border-2 border-transparent transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-stone-700',
            'data-[state=checked]:bg-primary',
            className
          )}
          {...props}
          ref={ref}
          id={inputId}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200',
              'data-[state=unchecked]:translate-x-0',
              'data-[state=checked]:translate-x-5',
              'rtl:data-[state=checked]:-translate-x-5'
            )}
          />
        </SwitchPrimitive.Root>
      </div>
    )
  }
)

Switch.displayName = 'Switch'

export { Switch }
export type { SwitchProps }
