import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[100]',
      'bg-[hsl(var(--foreground)/0.48)]',
      'dark:bg-[hsl(240_10%_5%_/_.75)]',
      'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-in data-[state=closed]:opacity-0',
      'motion-reduce:animate-none motion-reduce:data-[state=open]:opacity-100',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName || 'DialogOverlay'

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { showClose?: boolean }
>(({ className, children, showClose = true, ...props }, ref) => (
  <DialogPortal>
    {/* Radix Portal mounts to document.body by default; focus trap and aria-modal are built-in */}
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-[101] w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain',
        'inset-0 m-auto',
        'rounded-2xl border border-border bg-card text-card-foreground',
        'shadow-[0_8px_30px_hsl(var(--foreground)/0.12),0_2px_8px_hsl(var(--primary)/0.08)]',
        'dark:border-primary/10 dark:shadow-[0_8px_30px_hsl(0_0%_0%_/_.5),0_0_0_1px_hsl(var(--primary)/0.15)]',
        'p-4 sm:p-6',
        'data-[state=open]:animate-scale-in data-[state=closed]:opacity-0 data-[state=closed]:scale-95',
        'motion-reduce:animate-none motion-reduce:data-[state=open]:opacity-100 motion-reduce:data-[state=open]:scale-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close
          className={cn(
            'absolute top-3 end-3 sm:top-4 sm:end-4 rounded-lg p-2 min-w-[44px] min-h-[44px] flex items-center justify-center',
            'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
          )}
          aria-label="Close"
        >
          <X className="h-5 w-5 shrink-0" strokeWidth={2} />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName || 'DialogContent'

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 text-center sm:text-start pe-10', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2 mt-6 rtl:sm:flex-row-reverse', className)}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName || 'DialogTitle'

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground mt-1', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName || 'DialogDescription'

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
