import * as React from 'react'
import { cn } from '@/lib/utils'

export type CustomerEmptyStateVariant = 'page' | 'subsection'

interface CustomerEmptyStateProps {
  variant?: CustomerEmptyStateVariant
  icon: React.ReactNode
  title: string
  description?: string
  action: React.ReactNode
  dir?: 'rtl' | 'ltr'
  className?: string
}

/**
 * Wilson empty state: Cart-style (icon in ring, title with gold underline, description, CTA, trust line).
 * - page: full section, min-h-[60vh], section-padding section-creative-warm (cart, full-page).
 * - subsection: fits container, no min-height, same look (orders list, wishlist under header/tabs).
 */
const CustomerEmptyState = ({
  variant = 'page',
  icon,
  title,
  description,
  action,
  dir = 'ltr',
  className,
}: CustomerEmptyStateProps) => {
  const isPage = variant === 'page'

  const content = (
    <>
      <div
        className="flex flex-shrink-0 items-center justify-center rounded-2xl w-20 h-20 sm:w-24 sm:h-24 ring-1 ring-primary/25 bg-primary/10 mb-6 [&_svg]:text-primary"
        aria-hidden
      >
        {icon}
      </div>
      <h2
        className={cn(
          'font-bold text-foreground mb-2 text-center title-underline-gold title-underline-gold-center',
          isPage ? 'text-h2' : 'text-xl'
        )}
      >
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground mb-6 text-center max-w-sm">
          {description}
        </p>
      )}
      {action}
    </>
  )

  if (isPage) {
    return (
      <section
        className={cn(
          'min-h-[60vh] flex flex-col items-center justify-center section-padding section-creative-warm',
          className
        )}
        dir={dir}
      >
        {content}
      </section>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 sm:py-16 text-center',
        className
      )}
      dir={dir}
    >
      {content}
    </div>
  )
}

export { CustomerEmptyState }
