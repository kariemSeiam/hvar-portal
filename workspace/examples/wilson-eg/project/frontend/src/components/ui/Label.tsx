import { forwardRef, LabelHTMLAttributes } from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium text-foreground leading-none',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      'data-[disabled]:opacity-70',
      className
    )}
    {...props}
  />
))

Label.displayName = 'Label'

export { Label }
export type { LabelProps }
