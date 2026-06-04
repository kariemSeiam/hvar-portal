import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-3 p-4 sm:bottom-0 sm:end-0 sm:top-auto sm:flex-col md:max-w-[380px]',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName || 'ToastViewport'

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-start justify-between gap-4 overflow-hidden rounded-xl border p-4 pe-10 shadow-[0_4px_16px_hsl(var(--primary)/0.08)] dark:shadow-[0_4px_20px_hsl(0_0%_0%/0.25)] transition-all duration-200 ease-out',
  {
    variants: {
      variant: {
        default:
          'border-border bg-card text-card-foreground',
        destructive:
          'border-danger-300 dark:border-danger-700 bg-danger-50 dark:bg-danger-950/60 text-danger-800 dark:text-danger-200',
        success:
          'border-success-300 dark:border-success-700 bg-success-50 dark:bg-success-900/30 text-success-800 dark:text-success-200',
        warning:
          'border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20 text-warning-800 dark:text-warning-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
))
Toast.displayName = ToastPrimitives.Root.displayName || 'Toast'

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    toast-close=""
    className={cn(
      'absolute top-2 end-2 rounded-lg p-1.5 text-muted-foreground opacity-80 hover:opacity-100 hover:bg-muted/50 transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card',
      'group-[.destructive]:text-danger-700 group-[.destructive]:hover:bg-danger-100 dark:group-[.destructive]:hover:bg-danger-900/40',
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName || 'ToastClose'

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm sm:text-base font-semibold font-cairo leading-snug', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName || 'ToastTitle'

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm font-tajawal leading-relaxed mt-0.5 opacity-90', className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName || 'ToastDescription'

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-9 min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-primary bg-transparent px-3 text-sm font-medium text-primary',
      'ring-offset-card transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'group-[.destructive]:border-danger-300 group-[.destructive]:text-danger-700 group-[.destructive]:hover:bg-danger-100 dark:group-[.destructive]:border-danger-700 dark:group-[.destructive]:hover:bg-danger-900/40',
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName || 'ToastAction'

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  toastVariants,
}
export type { VariantProps }
export type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
export type ToastActionElement = React.ReactElement<typeof ToastAction>
