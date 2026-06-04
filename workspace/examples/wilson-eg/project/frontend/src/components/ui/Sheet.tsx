import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 sheet-overlay',
      'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
      className
    )}
    {...props}
  />
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName || 'SheetOverlay'

type SheetContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left'
  showClose?: boolean
  dir?: 'ltr' | 'rtl'
  variant?: 'default' | 'menu'
}

const sheetSideVariants = {
  top: 'inset-x-0 top-0 border-b data-[state=open]:animate-slide-in-from-top data-[state=closed]:animate-fade-out',
  bottom: 'inset-x-0 bottom-0 border-t data-[state=open]:animate-slide-in-from-bottom data-[state=closed]:animate-fade-out',
  left: 'inset-y-0 start-0 h-full w-3/4 border-e sm:max-w-sm',
  right: 'inset-y-0 end-0 h-full w-3/4 border-s sm:max-w-sm',
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, showClose = true, dir, variant = 'default', ...props }, ref) => {
  // Determine animation classes based on variant and side/dir
  let animationClasses = ''
  if (variant === 'menu') {
    // Menu uses the premium 3D door swing
    const isRtlSwing = (side === 'right' && dir !== 'ltr') || (side === 'left' && dir === 'rtl')
    animationClasses = isRtlSwing
      ? 'data-[state=open]:animate-menu-drawer-open-rtl data-[state=closed]:animate-menu-drawer-close-rtl'
      : 'data-[state=open]:animate-menu-drawer-open-ltr data-[state=closed]:animate-menu-drawer-close-ltr'
  } else {
    // Default uses standard slide
    if (side === 'left') animationClasses = 'data-[state=open]:animate-slide-in-from-left data-[state=closed]:animate-fade-out'
    else if (side === 'right') animationClasses = 'data-[state=open]:animate-slide-in-from-right data-[state=closed]:animate-fade-out'
  }

  const contentEl = (
    <DialogPrimitive.Content
      ref={ref}
      dir={dir}
      className={cn(
        'fixed z-50 flex flex-col',
        sheetSideVariants[side],
        animationClasses,
        // Base styling only for non-menu variants
        variant !== 'menu' && 'gap-4 bg-card p-6 shadow-gold-lg',
        className
      )}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close
          className={cn(
            'absolute top-4 end-4 rounded-lg p-1.5 opacity-70',
            'hover:opacity-100 hover:bg-muted transition-all',
            'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2'
          )}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  )

  return (
    <SheetPortal>
      <SheetOverlay />
      {contentEl}
    </SheetPortal>
  )
})
SheetContent.displayName = DialogPrimitive.Content.displayName || 'SheetContent'

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 text-center sm:text-start', className)} {...props} />
)
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2', className)}
    {...props}
  />
)
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
SheetTitle.displayName = DialogPrimitive.Title.displayName || 'SheetTitle'

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
SheetDescription.displayName = DialogPrimitive.Description.displayName || 'SheetDescription'

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
