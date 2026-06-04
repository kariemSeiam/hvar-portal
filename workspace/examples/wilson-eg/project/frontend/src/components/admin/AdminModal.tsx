import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'

type AdminModalVariant = 'form' | 'confirm' | 'detail'

const variantMaxWidth: Record<AdminModalVariant, string> = {
  form: 'max-w-md',
  confirm: 'max-w-sm',
  detail: 'max-w-2xl',
}

export interface AdminModalContentProps {
  variant?: AdminModalVariant
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  contentClassName?: string
}

/**
 * Admin modal content wrapper. Use with <Dialog open={...} onOpenChange={...}>.
 * Provides Wilson-consistent title, optional description, body, and footer with variant-based max-width.
 */
export function AdminModalContent({
  variant = 'form',
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: AdminModalContentProps) {
  return (
    <DialogContent
      className={cn(variantMaxWidth[variant], 'w-[90vw] sm:w-full', contentClassName)}
      showClose={true}
    >
      <DialogHeader className={className}>
        <DialogTitle className="text-xl font-bold text-foreground">{title}</DialogTitle>
        {description != null && (
          <DialogDescription className="mt-1">{description}</DialogDescription>
        )}
      </DialogHeader>
      <div className="mt-4">{children}</div>
      {footer != null && <DialogFooter className="mt-6">{footer}</DialogFooter>}
    </DialogContent>
  )
}

export {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogContent,
}
