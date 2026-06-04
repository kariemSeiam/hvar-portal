/**
 * PageBreadcrumb — Wilson: deep pages (product detail, checkout).
 * Min text 0.875rem (text-sm), generous bar padding, RTL-safe separator.
 */
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[]
  /** e.g. container-wide, container-narrow */
  containerClassName?: string
  /** For RTL layout */
  dir?: 'rtl' | 'ltr'
  /** aria-label for nav */
  ariaLabel?: string
}

export function PageBreadcrumb({
  items,
  containerClassName = 'container-wide',
  dir,
  ariaLabel = 'Breadcrumb',
}: PageBreadcrumbProps) {
  return (
    <div className="page-breadcrumb-bar">
      <div className={containerClassName}>
        <nav
          className="page-breadcrumb-nav"
          aria-label={ariaLabel}
          dir={dir}
        >
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <span key={i} className="inline-flex items-center gap-2 min-h-[44px]">
                {i > 0 && (
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted-foreground/70 rtl:rotate-180"
                    aria-hidden
                  />
                )}
                {item.href && !isLast ? (
                  <Link
                    to={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors font-medium no-underline hover:no-underline"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={isLast ? 'text-foreground font-semibold max-w-[min(100%,20rem)] truncate' : 'text-muted-foreground'}
                    aria-current={isLast ? 'page' : undefined}
                    title={isLast ? item.label : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </span>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
